const mongoose = require('mongoose');

const learningResourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Resource title is required'],
      trim: true,
    },
    url: {
      type: String,
      required: [true, 'Resource URL is required'],
      trim: true,
    },
    skillTag: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedSkill: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      trim: true,
    },
    resourceType: {
      type: String,
      enum: ['course', 'documentation', 'tutorial', 'book', 'video'],
      default: 'course',
    },
    isFree: {
      type: Boolean,
      default: true,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const LearningResource = mongoose.model('LearningResource', learningResourceSchema);
module.exports = LearningResource;
