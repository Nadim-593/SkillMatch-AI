const Job = require('../models/Job');
const aiService = require('../services/aiService');

/**
 * @desc    Create a new job posting with skill extraction
 * @route   POST /api/v1/jobs
 * @access  Private (Recruiter & Admin)
 */
const createJob = async (req, res, next) => {
  try {
    const {
      title,
      company,
      location,
      jobType,
      description,
      responsibilities,
      requiredSkills,
      preferredSkills,
      minimumExperienceYears,
      autoExtractSkills = false,
    } = req.body;

    if (!title || !company || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title, company, and description are required.',
      });
    }

    let reqSkills = requiredSkills || [];
    let prefSkills = preferredSkills || [];

    // If autoExtractSkills is requested or no skills provided, extract via AI microservice
    if (autoExtractSkills || (reqSkills.length === 0 && prefSkills.length === 0)) {
      try {
        const extracted = await aiService.extractJobSkills(title, description, responsibilities);
        if (extracted.requiredSkills && extracted.requiredSkills.length > 0) {
          reqSkills = extracted.requiredSkills.map((s) => ({
            skillName: s.skill_name,
            normalizedName: s.normalized_name,
            category: s.category || 'General',
            evidence: s.evidence || '',
            importance: 'required',
          }));
        }
        if (extracted.preferredSkills && extracted.preferredSkills.length > 0) {
          prefSkills = extracted.preferredSkills.map((s) => ({
            skillName: s.skill_name,
            normalizedName: s.normalized_name,
            category: s.category || 'General',
            evidence: s.evidence || '',
            importance: 'preferred',
          }));
        }
      } catch (err) {
        console.warn('[WARN] Automatic job skill extraction failed, proceeding with manual skills:', err.message);
      }
    }

    const job = await Job.create({
      recruiter: req.user._id,
      title,
      company,
      location: location || 'Remote',
      jobType: jobType || 'full-time',
      description,
      responsibilities: responsibilities || '',
      requiredSkills: reqSkills,
      preferredSkills: prefSkills,
      minimumExperienceYears: minimumExperienceYears || 0,
      status: 'open',
    });

    res.status(201).json({
      success: true,
      message: 'Job posting created successfully',
      job,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all active jobs or filter by recruiter
 * @route   GET /api/v1/jobs
 * @access  Public / Private
 */
const getJobs = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.recruiter) {
      query.recruiter = req.query.recruiter;
    }
    if (req.query.status) {
      query.status = req.query.status;
    } else {
      query.status = 'open';
    }

    const jobs = await Job.find(query)
      .populate('recruiter', 'name company email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single job posting by ID
 * @route   GET /api/v1/jobs/:id
 * @access  Public
 */
const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate('recruiter', 'name company email');
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found',
      });
    }

    res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a job posting
 * @route   PUT /api/v1/jobs/:id
 * @access  Private (Owner Recruiter & Admin)
 */
const updateJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job posting not found' });
    }

    // Ownership check
    if (req.user.role !== 'admin' && job.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied: You do not own this job' });
    }

    const updatedJob = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Job posting updated successfully',
      job: updatedJob,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a job posting
 * @route   DELETE /api/v1/jobs/:id
 * @access  Private (Owner Recruiter & Admin)
 */
const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job posting not found' });
    }

    // Ownership check
    if (req.user.role !== 'admin' && job.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied: You do not own this job' });
    }

    await job.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Job posting deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
};
