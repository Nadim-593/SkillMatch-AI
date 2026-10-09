const Job = require('../models/Job');
const CandidateProfile = require('../models/CandidateProfile');
const MatchResult = require('../models/MatchResult');
const LearningResource = require('../models/LearningResource');
const User = require('../models/User');
const aiService = require('../services/aiService');
const { generateMatchPdf } = require('../utils/pdfGenerator');

/**
 * Retrieve curated learning resources from MongoDB for missing/partial skills.
 * @param {Array} skillItems - Missing and partial skills
 * @returns {Promise<Array>} curated resources
 */
const fetchCuratedResourcesForSkills = async (skillItems = []) => {
  if (!skillItems || skillItems.length === 0) return [];

  const names = skillItems
    .map((s) => s.normalizedName || s.normalized_name || s.skillName || s.skill_name)
    .filter(Boolean);
  const categories = skillItems.map((s) => s.category).filter(Boolean);

  // Exact normalized skill match or matching category
  const resources = await LearningResource.find({
    $or: [
      { normalizedSkill: { $in: names } },
      { skillTag: { $in: names } },
    ],
  }).limit(10);

  // If specific skills don't have enough, supplement by related category
  if (resources.length < 3 && categories.length > 0) {
    const additional = await LearningResource.find({
      _id: { $nin: resources.map((r) => r._id) },
    }).limit(3);
    return [...resources, ...additional];
  }

  return resources;
};

/**
 * @desc    Calculate or retrieve match between a candidate and a job
 * @route   POST /api/v1/matches/calculate
 * @access  Private (Candidate or Recruiter)
 */
const matchCandidateToJob = async (req, res, next) => {
  try {
    const { jobId, candidateId } = req.body;
    const targetCandidateId = candidateId || req.user._id;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const candidateProfile = await CandidateProfile.findOne({ user: targetCandidateId });
    if (!candidateProfile) {
      return res.status(404).json({ success: false, message: 'Candidate profile not found' });
    }

    // Format candidate skills for AI service
    const candidateSkills = (candidateProfile.confirmedSkills || []).map((s) => ({
      skill_name: s.skillName,
      normalized_name: s.normalizedName,
      category: s.category,
      evidence: s.evidence || '',
      source: 'cv',
      requirement: 'neutral',
      confidence: s.confidence || 0.85,
    }));

    // Format job skills
    const jobReqSkills = (job.requiredSkills || []).map((s) => ({
      skill_name: s.skillName,
      normalized_name: s.normalizedName,
      category: s.category,
      evidence: s.evidence || '',
      source: 'job',
      requirement: 'required',
      confidence: 1.0,
    }));

    const jobPrefSkills = (job.preferredSkills || []).map((s) => ({
      skill_name: s.skillName,
      normalized_name: s.normalizedName,
      category: s.category,
      evidence: s.evidence || '',
      source: 'job',
      requirement: 'preferred',
      confidence: 1.0,
    }));

    const candidateText = `${candidateProfile.headline || ''} ${candidateProfile.summary || ''} ${(candidateProfile.confirmedSkills || []).map((s) => s.evidence).join(' ')}`.trim();
    const jobText = `${job.title} ${job.description} ${job.responsibilities || ''}`.trim();

    // Call Python AI microservice for hybrid matching
    const matchResponse = await aiService.calculateMatch({
      candidate_id: targetCandidateId.toString(),
      job_id: job._id.toString(),
      candidate_skills: candidateSkills,
      job_required_skills: jobReqSkills,
      job_preferred_skills: jobPrefSkills,
      candidate_text: candidateText,
      job_text: jobText,
    });

    // Retrieve curated learning resources from MongoDB for missing & partial skills
    const missingAndPartial = [
      ...(matchResponse.missing_skills || []),
      ...(matchResponse.partial_skills || []),
    ];
    const learningResources = await fetchCuratedResourcesForSkills(missingAndPartial);

    // Persist or update MatchResult in MongoDB
    const matchDoc = await MatchResult.findOneAndUpdate(
      { candidate: targetCandidateId, job: job._id },
      {
        candidate: targetCandidateId,
        job: job._id,
        overallScore: matchResponse.overall_score,
        skillOverlapScore: matchResponse.skill_overlap_score,
        semanticSimilarityScore: matchResponse.semantic_similarity_score,
        scoringVersion: matchResponse.scoring_version || 'v1.0',
        matchedSkills: (matchResponse.matched_skills || []).map((s) => ({
          skillName: s.skill_name,
          normalizedName: s.normalized_name,
          category: s.category,
          status: s.status,
          explanation: s.explanation,
          evidence: s.evidence,
          requirement: s.requirement,
        })),
        partialSkills: (matchResponse.partial_skills || []).map((s) => ({
          skillName: s.skill_name,
          normalizedName: s.normalized_name,
          category: s.category,
          status: s.status,
          explanation: s.explanation,
          evidence: s.evidence,
          requirement: s.requirement,
        })),
        missingSkills: (matchResponse.missing_skills || []).map((s) => ({
          skillName: s.skill_name,
          normalizedName: s.normalized_name,
          category: s.category,
          status: s.status,
          explanation: s.explanation,
          evidence: s.evidence,
          requirement: s.requirement,
        })),
        explanation: matchResponse.explanation,
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      matchResult: matchDoc,
      learningResources,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get ranked jobs for currently authenticated candidate
 * @route   GET /api/v1/matches/ranked-jobs
 * @access  Private (Candidate only)
 */
const getRankedJobsForCandidate = async (req, res, next) => {
  try {
    const candidateId = req.user._id;
    const openJobs = await Job.find({ status: 'open' }).populate('recruiter', 'name company');

    if (openJobs.length === 0) {
      return res.status(200).json({ success: true, rankedJobs: [] });
    }

    const candidateProfile = await CandidateProfile.findOne({ user: candidateId });
    if (!candidateProfile || (candidateProfile.confirmedSkills || []).length === 0) {
      // If candidate has not completed skills yet, return jobs unranked
      const unranked = openJobs.map((j) => ({
        job: j,
        overallScore: 0,
        skillOverlapScore: 0,
        semanticSimilarityScore: 0,
        matchedCount: 0,
        missingCount: (j.requiredSkills || []).length,
      }));
      return res.status(200).json({ success: true, rankedJobs: unranked });
    }

    // Check existing match results in MongoDB
    const existingMatches = await MatchResult.find({ candidate: candidateId });
    const matchMap = new Map();
    existingMatches.forEach((m) => matchMap.set(m.job.toString(), m));

    const rankedList = [];
    for (const job of openJobs) {
      let match = matchMap.get(job._id.toString());

      if (!match) {
        // Compute match on the fly if not cached
        const candidateSkills = candidateProfile.confirmedSkills.map((s) => ({
          skill_name: s.skillName,
          normalized_name: s.normalizedName,
          category: s.category,
          evidence: s.evidence || '',
          source: 'cv',
          requirement: 'neutral',
          confidence: s.confidence || 0.85,
        }));
        const jobReqSkills = (job.requiredSkills || []).map((s) => ({
          skill_name: s.skillName,
          normalized_name: s.normalizedName,
          category: s.category,
          evidence: s.evidence || '',
          source: 'job',
          requirement: 'required',
          confidence: 1.0,
        }));
        const jobPrefSkills = (job.preferredSkills || []).map((s) => ({
          skill_name: s.skillName,
          normalized_name: s.normalizedName,
          category: s.category,
          evidence: s.evidence || '',
          source: 'job',
          requirement: 'preferred',
          confidence: 1.0,
        }));

        try {
          const matchResponse = await aiService.calculateMatch({
            candidate_id: candidateId.toString(),
            job_id: job._id.toString(),
            candidate_skills: candidateSkills,
            job_required_skills: jobReqSkills,
            job_preferred_skills: jobPrefSkills,
            candidate_text: `${candidateProfile.headline} ${candidateProfile.summary}`,
            job_text: `${job.title} ${job.description}`,
          });

          match = await MatchResult.create({
            candidate: candidateId,
            job: job._id,
            overallScore: matchResponse.overall_score,
            skillOverlapScore: matchResponse.skill_overlap_score,
            semanticSimilarityScore: matchResponse.semantic_similarity_score,
            matchedSkills: matchResponse.matched_skills || [],
            partialSkills: matchResponse.partial_skills || [],
            missingSkills: matchResponse.missing_skills || [],
            explanation: matchResponse.explanation,
          });
        } catch (e) {
          match = { overallScore: 0, skillOverlapScore: 0, semanticSimilarityScore: 0 };
        }
      }

      rankedList.push({
        job,
        matchId: match._id,
        overallScore: match.overallScore || 0,
        skillOverlapScore: match.skillOverlapScore || 0,
        semanticSimilarityScore: match.semanticSimilarityScore || 0,
        matchedCount: (match.matchedSkills || []).length,
        partialCount: (match.partialSkills || []).length,
        missingCount: (match.missingSkills || []).length,
        explanation: match.explanation,
      });
    }

    // Sort by overall fit descending
    rankedList.sort((a, b) => b.overallScore - a.overallScore);

    res.status(200).json({
      success: true,
      rankedJobs: rankedList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get ranked candidates for a recruiter's job posting
 * @route   GET /api/v1/matches/ranked-candidates/:jobId
 * @access  Private (Recruiter only)
 */
const getRankedCandidatesForJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Verify ownership (unless admin)
    if (req.user.role !== 'admin' && job.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied: You do not own this job' });
    }

    const profiles = await CandidateProfile.find({ profileCompleted: true }).populate('user', 'name email');

    const rankedCandidates = [];
    for (const cp of profiles) {
      if (!cp.user) continue;

      let match = await MatchResult.findOne({ candidate: cp.user._id, job: job._id });

      if (!match) {
        // Calculate match if not exists
        const candSkills = (cp.confirmedSkills || []).map((s) => ({
          skill_name: s.skillName,
          normalized_name: s.normalizedName,
          category: s.category,
          evidence: s.evidence || '',
          source: 'cv',
          requirement: 'neutral',
          confidence: s.confidence || 0.85,
        }));
        const jReq = (job.requiredSkills || []).map((s) => ({
          skill_name: s.skillName,
          normalized_name: s.normalizedName,
          category: s.category,
          evidence: s.evidence || '',
          source: 'job',
          requirement: 'required',
          confidence: 1.0,
        }));
        const jPref = (job.preferredSkills || []).map((s) => ({
          skill_name: s.skillName,
          normalized_name: s.normalizedName,
          category: s.category,
          evidence: s.evidence || '',
          source: 'job',
          requirement: 'preferred',
          confidence: 1.0,
        }));

        try {
          const matchResponse = await aiService.calculateMatch({
            candidate_id: cp.user._id.toString(),
            job_id: job._id.toString(),
            candidate_skills: candSkills,
            job_required_skills: jReq,
            job_preferred_skills: jPref,
            candidate_text: `${cp.headline} ${cp.summary}`,
            job_text: `${job.title} ${job.description}`,
          });

          match = await MatchResult.create({
            candidate: cp.user._id,
            job: job._id,
            overallScore: matchResponse.overall_score,
            skillOverlapScore: matchResponse.skill_overlap_score,
            semanticSimilarityScore: matchResponse.semantic_similarity_score,
            matchedSkills: matchResponse.matched_skills || [],
            partialSkills: matchResponse.partial_skills || [],
            missingSkills: matchResponse.missing_skills || [],
            explanation: matchResponse.explanation,
          });
        } catch (e) {
          match = { overallScore: 0, skillOverlapScore: 0, semanticSimilarityScore: 0 };
        }
      }

      rankedCandidates.push({
        candidate: {
          _id: cp.user._id,
          name: cp.user.name,
          email: cp.user.email,
          headline: cp.headline,
          location: cp.location,
        },
        matchId: match._id,
        overallScore: match.overallScore || 0,
        skillOverlapScore: match.skillOverlapScore || 0,
        semanticSimilarityScore: match.semanticSimilarityScore || 0,
        matchedCount: (match.matchedSkills || []).length,
        missingCount: (match.missingSkills || []).length,
        explanation: match.explanation,
      });
    }

    rankedCandidates.sort((a, b) => b.overallScore - a.overallScore);

    res.status(200).json({
      success: true,
      job: { _id: job._id, title: job.title, company: job.company },
      rankedCandidates,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get match details and curated learning recommendations by match ID
 * @route   GET /api/v1/matches/:id
 * @access  Private
 */
const getMatchDetails = async (req, res, next) => {
  try {
    const match = await MatchResult.findById(req.params.id)
      .populate('candidate', 'name email')
      .populate('job');

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match result not found' });
    }

    // Authorization check: only the candidate themselves, the job recruiter, or admin can view
    const isOwnerCandidate = match.candidate?._id?.toString() === req.user._id.toString();
    const isOwnerRecruiter = match.job?.recruiter?.toString() === req.user._id.toString();
    if (!isOwnerCandidate && !isOwnerRecruiter && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied: You do not have permission to view this report' });
    }

    // Retrieve curated learning resources from database for missing & partial skills
    const missingAndPartial = [...(match.missingSkills || []), ...(match.partialSkills || [])];
    const learningResources = await fetchCuratedResourcesForSkills(missingAndPartial);

    res.status(200).json({
      success: true,
      matchResult: match,
      learningResources,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Download PDF match and skill gap report
 * @route   GET /api/v1/matches/:id/pdf
 * @access  Private
 */
const downloadMatchPdf = async (req, res, next) => {
  try {
    const match = await MatchResult.findById(req.params.id)
      .populate('candidate', 'name email')
      .populate('job');

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match result not found' });
    }

    const isOwnerCandidate = match.candidate?._id?.toString() === req.user._id.toString();
    const isOwnerRecruiter = match.job?.recruiter?.toString() === req.user._id.toString();
    if (!isOwnerCandidate && !isOwnerRecruiter && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const missingAndPartial = [...(match.missingSkills || []), ...(match.partialSkills || [])];
    const learningResources = await fetchCuratedResourcesForSkills(missingAndPartial);

    const pdfBuffer = await generateMatchPdf({
      candidate: match.candidate,
      job: match.job,
      matchResult: match,
      learningResources,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="SkillMatch-Report-${match._id}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get candidate's match history
 * @route   GET /api/v1/matches/history
 * @access  Private (Candidate only)
 */
const getCandidateMatchHistory = async (req, res, next) => {
  try {
    const matches = await MatchResult.find({ candidate: req.user._id })
      .populate('job', 'title company location status')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      matches,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  matchCandidateToJob,
  getRankedJobsForCandidate,
  getRankedCandidatesForJob,
  getMatchDetails,
  downloadMatchPdf,
  getCandidateMatchHistory,
};
