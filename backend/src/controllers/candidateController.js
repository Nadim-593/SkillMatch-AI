const CandidateProfile = require('../models/CandidateProfile');

/**
 * @desc    Get candidate profile
 * @route   GET /api/v1/candidates/profile
 * @access  Private (Candidate only)
 */
const getProfile = async (req, res, next) => {
  try {
    const profile = await CandidateProfile.findOne({ user: req.user._id }).populate('currentCv');
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found',
      });
    }

    res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Review and save confirmed skills on candidate profile
 * @route   PUT /api/v1/candidates/profile/skills
 * @access  Private (Candidate only)
 */
const updateProfileSkills = async (req, res, next) => {
  try {
    const { skills, confirmedSkills, headline, summary, location, phone } = req.body;
    const targetSkills = skills || confirmedSkills;

    if (!Array.isArray(targetSkills)) {
      return res.status(400).json({
        success: false,
        message: 'Skills must be an array of skill objects.',
      });
    }

    // Format skill objects cleanly
    const formattedSkills = targetSkills.map((s) => ({
      skillName: (s.skillName || s.skill_name || '').trim(),
      normalizedName: (s.normalizedName || s.normalized_name || s.skillName || '').trim(),
      category: s.category || 'General',
      proficiency: s.proficiency || 'intermediate',
      evidence: (s.evidence || '').trim(),
      confidence: typeof s.confidence === 'number' ? s.confidence : 0.8,
    })).filter((s) => s.skillName.length > 0);

    const updateData = {
      confirmedSkills: formattedSkills,
      profileCompleted: formattedSkills.length > 0,
    };

    if (headline !== undefined) updateData.headline = headline;
    if (summary !== undefined) updateData.summary = summary;
    if (location !== undefined) updateData.location = location;
    if (phone !== undefined) updateData.phone = phone;

    const profile = await CandidateProfile.findOneAndUpdate(
      { user: req.user._id },
      updateData,
      { new: true, upsert: true }
    ).populate('currentCv');

    res.status(200).json({
      success: true,
      message: 'Skills and candidate profile updated successfully',
      profile,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfileSkills,
};
