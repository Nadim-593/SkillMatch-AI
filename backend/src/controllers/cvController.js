const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const CVDocument = require('../models/CVDocument');
const CandidateProfile = require('../models/CandidateProfile');
const aiService = require('../services/aiService');
const { uploadDir } = require('../middleware/upload');

/**
 * @desc    Upload CV document (PDF or DOCX) and extract skills via AI
 * @route   POST /api/v1/cvs/upload
 * @access  Private (Candidate only)
 */
const uploadCv = async (req, res, next) => {
  let cvDoc = null;
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No document file uploaded. Please select a PDF or DOCX file.',
      });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const safeFilename = `${uuidv4()}${ext}`;
    const destinationPath = path.join(uploadDir, safeFilename);

    // Save file buffer safely to disk
    fs.writeFileSync(destinationPath, req.file.buffer);

    // 1. Create CVDocument entry with pending status
    cvDoc = await CVDocument.create({
      candidate: req.user._id,
      originalFilename: req.file.originalname,
      safeFilename,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      uploadPath: destinationPath,
      extractionStatus: 'processing',
    });

    // 2. Extract readable text from document via Python service
    let extractedText = '';
    try {
      extractedText = await aiService.extractDocumentText(req.file.buffer, req.file.originalname);
    } catch (parseErr) {
      cvDoc.extractionStatus = 'failed';
      cvDoc.errorMessage = parseErr.message;
      await cvDoc.save();
      return res.status(parseErr.statusCode || 400).json({
        success: false,
        message: `Failed to extract text from document: ${parseErr.message}`,
      });
    }

    // 3. Extract skills from the text via Mistral / taxonomy
    const extractedSkills = await aiService.extractCvSkills(extractedText, req.user._id);

    // 4. Update CVDocument with completed status and results
    cvDoc.rawText = extractedText;
    cvDoc.extractionStatus = 'completed';
    cvDoc.extractedSkillsSummary = extractedSkills.map((s) => s.normalized_name);
    await cvDoc.save();

    // 5. Link to CandidateProfile
    await CandidateProfile.findOneAndUpdate(
      { user: req.user._id },
      { currentCv: cvDoc._id },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: 'CV uploaded and processed successfully',
      cv: cvDoc,
      extractedSkills,
      rawTextLength: extractedText.length,
    });
  } catch (error) {
    if (cvDoc) {
      cvDoc.extractionStatus = 'failed';
      cvDoc.errorMessage = error.message;
      await cvDoc.save().catch(() => {});
    }
    next(error);
  }
};

/**
 * @desc    Submit manual CV text and extract skills via AI
 * @route   POST /api/v1/cvs/manual-text
 * @access  Private (Candidate only)
 */
const submitManualText = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || text.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: 'CV text is too short. Please provide at least 20 characters describing your skills and experience.',
      });
    }

    const cleanText = text.trim();

    // 1. Create CVDocument entry
    const cvDoc = await CVDocument.create({
      candidate: req.user._id,
      originalFilename: 'manual-text-entry.txt',
      safeFilename: `${uuidv4()}.txt`,
      mimeType: 'text/plain',
      fileSize: Buffer.byteLength(cleanText, 'utf8'),
      uploadPath: 'memory://manual-entry',
      extractionStatus: 'processing',
      rawText: cleanText,
    });

    // 2. Extract skills via AI
    const extractedSkills = await aiService.extractCvSkills(cleanText, req.user._id);

    // 3. Complete CVDocument
    cvDoc.extractionStatus = 'completed';
    cvDoc.extractedSkillsSummary = extractedSkills.map((s) => s.normalized_name);
    await cvDoc.save();

    // 4. Link to CandidateProfile
    await CandidateProfile.findOneAndUpdate(
      { user: req.user._id },
      { currentCv: cvDoc._id },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: 'CV text analyzed successfully',
      cv: cvDoc,
      extractedSkills,
      rawTextLength: cleanText.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current candidate's active CV document
 * @route   GET /api/v1/cvs/my-cv
 * @access  Private (Candidate only)
 */
const getMyCv = async (req, res, next) => {
  try {
    const profile = await CandidateProfile.findOne({ user: req.user._id }).populate('currentCv');
    if (!profile || !profile.currentCv) {
      return res.status(404).json({
        success: false,
        message: 'No CV uploaded yet for this candidate profile.',
      });
    }

    res.status(200).json({
      success: true,
      cv: profile.currentCv,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadCv,
  submitManualText,
  getMyCv,
};
