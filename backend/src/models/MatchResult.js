const mongoose = require('mongoose');

const skillMatchItemSchema = new mongoose.Schema(
  {
    skillName: { type: String, required: true },
    normalizedName: { type: String, required: true },
    category: { type: String, default: 'General' },
    status: {
      type: String,
      enum: ['matched', 'partial', 'missing'],
      required: true,
    },
    explanation: { type: String, default: '' },
    evidence: { type: String, default: '' },
    requirement: {
      type: String,
      enum: ['required', 'preferred', 'neutral'],
      default: 'required',
    },
  },
  { _id: true }
);

const matchResultSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true,
    },
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    skillOverlapScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    semanticSimilarityScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    scoringVersion: {
      type: String,
      default: 'v1.0',
    },
    matchedSkills: [skillMatchItemSchema],
    partialSkills: [skillMatchItemSchema],
    missingSkills: [skillMatchItemSchema],
    explanation: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

matchResultSchema.index({ candidate: 1, job: 1 });

const MatchResult = mongoose.model('MatchResult', matchResultSchema);
module.exports = MatchResult;
