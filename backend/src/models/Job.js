const mongoose = require('mongoose');

const jobSkillSchema = new mongoose.Schema(
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
    evidence: {
      type: String,
      default: '',
    },
    importance: {
      type: String,
      enum: ['required', 'preferred'],
      default: 'required',
    },
  },
  { _id: true }
);

const jobSchema = new mongoose.Schema(
  {
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a job title'],
      trim: true,
    },
    company: {
      type: String,
      required: [true, 'Please provide a company name'],
      trim: true,
    },
    location: {
      type: String,
      default: 'Remote',
      trim: true,
    },
    jobType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'internship'],
      default: 'full-time',
    },
    description: {
      type: String,
      required: [true, 'Please provide a job description'],
    },
    responsibilities: {
      type: String,
      default: '',
    },
    requiredSkills: [jobSkillSchema],
    preferredSkills: [jobSkillSchema],
    minimumExperienceYears: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['open', 'closed', 'draft'],
      default: 'open',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Job = mongoose.model('Job', jobSchema);
module.exports = Job;
