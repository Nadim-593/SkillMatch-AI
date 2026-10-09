const mongoose = require('mongoose');

const cvDocumentSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    originalFilename: {
      type: String,
      required: true,
      trim: true,
    },
    safeFilename: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    uploadPath: {
      type: String,
      required: true,
    },
    extractionStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    rawText: {
      type: String,
      default: '',
    },
    extractedSkillsSummary: [
      {
        type: String,
        trim: true,
      },
    ],
    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const CVDocument = mongoose.model('CVDocument', cvDocumentSchema);
module.exports = CVDocument;
