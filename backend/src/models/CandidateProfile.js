const mongoose = require('mongoose');

const skillItemSchema = new mongoose.Schema(
  {
    skillName: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: 'General',
    },
    proficiency: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert', 'unspecified'],
      default: 'unspecified',
    },
    evidence: {
      type: String,
      default: '',
    },
    confidence: {
      type: Number,
      default: 0.8,
      min: 0,
      max: 1,
    },
  },
  { _id: true }
);

const experienceItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    company: { type: String, required: true },
    duration: { type: String, default: '' },
    description: { type: String, default: '' },
  },
  { _id: true }
);

const educationItemSchema = new mongoose.Schema(
  {
    degree: { type: String, required: true },
    institution: { type: String, required: true },
    year: { type: String, default: '' },
  },
  { _id: true }
);

const candidateProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    headline: {
      type: String,
      trim: true,
      default: '',
    },
    summary: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    confirmedSkills: [skillItemSchema],
    experience: [experienceItemSchema],
    education: [educationItemSchema],
    currentCv: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CVDocument',
      default: null,
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const CandidateProfile = mongoose.model('CandidateProfile', candidateProfileSchema);
module.exports = CandidateProfile;
