const mongoose = require('mongoose');

const skillTaxonomySchema = new mongoose.Schema(
  {
    canonicalName: {
      type: String,
      required: [true, 'Canonical skill name is required'],
      unique: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Skill category is required'],
      trim: true,
      index: true,
    },
    aliases: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    description: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const SkillTaxonomy = mongoose.model('SkillTaxonomy', skillTaxonomySchema);
module.exports = SkillTaxonomy;
