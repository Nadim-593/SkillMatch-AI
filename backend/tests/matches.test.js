const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/server');
const User = require('../src/models/User');
const Job = require('../src/models/Job');
const CandidateProfile = require('../src/models/CandidateProfile');
const MatchResult = require('../src/models/MatchResult');
const LearningResource = require('../src/models/LearningResource');

// Mock aiService for deterministic backend integration testing
jest.mock('../src/services/aiService', () => ({
  calculateMatch: jest.fn(async (params) => {
    const candSkillNames = (params.candidate_skills || []).map((s) => s.normalized_name.toLowerCase());
    const matched = [];
    const missing = [];
    const partial = [];

    (params.job_required_skills || []).forEach((reqSkill) => {
      if (candSkillNames.includes(reqSkill.normalized_name.toLowerCase())) {
        matched.push({
          skill_name: reqSkill.skill_name,
          normalized_name: reqSkill.normalized_name,
          category: reqSkill.category,
          status: 'matched',
          explanation: `Found ${reqSkill.normalized_name} in candidate CV`,
          evidence: reqSkill.evidence || '',
          requirement: 'required',
        });
      } else {
        missing.push({
          skill_name: reqSkill.skill_name,
          normalized_name: reqSkill.normalized_name,
          category: reqSkill.category,
          status: 'missing',
          explanation: `Missing ${reqSkill.normalized_name}`,
          evidence: '',
          requirement: 'required',
        });
      }
    });

    const totalReq = (params.job_required_skills || []).length;
    const overlapScore = totalReq > 0 ? (matched.length / totalReq) * 100 : 50;
    const semanticScore = 80.0;
    const overallScore = Math.round((0.6 * overlapScore + 0.4 * semanticScore) * 100) / 100;

    return {
      success: true,
      candidate_id: params.candidate_id,
      job_id: params.job_id,
      overall_score: overallScore,
      skill_overlap_score: overlapScore,
      semantic_similarity_score: semanticScore,
      matched_skills: matched,
      partial_skills: partial,
      missing_skills: missing,
      explanation: `Match evaluated: ${overallScore}/100. Overlap: ${overlapScore}%, Semantic: ${semanticScore}%.`,
      scoring_version: 'v1.0',
    };
  }),
}));

const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/skillmatch_test';

let candidateToken = '';
let candidateUser = null;
let recruiterToken = '';
let recruiterUser = null;
let otherRecruiterToken = '';
let otherJob = null;
let testJob = null;
let testMatch = null;

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI, { serverSelectionTimeoutMS: 5000 });
  await User.deleteMany({ email: /@matchtest\.com$/ });
  await Job.deleteMany({ title: /MatchTest/ });
  await CandidateProfile.deleteMany({});
  await MatchResult.deleteMany({});

  // Seed at least one verified learning resource for testing
  await LearningResource.deleteMany({ skillTag: 'Docker' });
  await LearningResource.create({
    title: 'Docker Official Documentation',
    skillTag: 'Docker',
    normalizedSkill: 'Docker',
    category: 'DevOps',
    url: 'https://docs.docker.com/',
    provider: 'Docker',
    type: 'documentation',
    isFree: true,
    difficulty: 'beginner',
  });

  // Create candidate
  const candRes = await request(app).post('/api/v1/auth/register').send({
    name: 'Candidate For Matching',
    email: 'cand@matchtest.com',
    password: 'Password123!',
    role: 'candidate',
  });
  candidateToken = candRes.body.token;
  candidateUser = candRes.body.user;

  // Set candidate confirmed skills
  await CandidateProfile.findOneAndUpdate(
    { user: candidateUser._id },
    {
      headline: 'Full-stack Engineer',
      summary: 'Experienced with React and Node.js',
      confirmedSkills: [
        { skillName: 'React', normalizedName: 'React', category: 'Frontend', confidence: 0.95 },
        { skillName: 'Node.js', normalizedName: 'Node.js', category: 'Backend', confidence: 0.90 },
      ],
      profileCompleted: true,
    },
    { upsert: true }
  );

  // Create primary recruiter
  const recRes = await request(app).post('/api/v1/auth/register').send({
    name: 'Recruiter Matcher',
    email: 'rec@matchtest.com',
    password: 'Password123!',
    role: 'recruiter',
  });
  recruiterToken = recRes.body.token;
  recruiterUser = recRes.body.user;

  // Create other recruiter (for ownership check)
  const otherRecRes = await request(app).post('/api/v1/auth/register').send({
    name: 'Other Recruiter',
    email: 'otherrec@matchtest.com',
    password: 'Password123!',
    role: 'recruiter',
  });
  otherRecruiterToken = otherRecRes.body.token;

  // Create job owned by primary recruiter
  testJob = await Job.create({
    title: 'MatchTest Full Stack Dev',
    company: 'Tech Corp',
    description: 'Looking for a developer with React, Node.js, and Docker',
    recruiter: recruiterUser._id,
    requiredSkills: [
      { skillName: 'React', normalizedName: 'React', category: 'Frontend', importance: 'required' },
      { skillName: 'Docker', normalizedName: 'Docker', category: 'DevOps', importance: 'required' },
    ],
    preferredSkills: [],
    status: 'open',
  });

  // Create job owned by other recruiter
  otherJob = await Job.create({
    title: 'MatchTest Secret Role',
    company: 'Secret Corp',
    description: 'Internal position',
    recruiter: otherRecRes.body.user._id,
    requiredSkills: [],
    status: 'open',
  });
});

afterAll(async () => {
  await User.deleteMany({ email: /@matchtest\.com$/ });
  await Job.deleteMany({ title: /MatchTest/ });
  await CandidateProfile.deleteMany({});
  await MatchResult.deleteMany({});
  await LearningResource.deleteMany({ skillTag: 'Docker' });
  await mongoose.connection.close();
});

describe('Match & Skill Gap Analysis API — Phases 6 & 7', () => {
  describe('POST /api/v1/matches/calculate', () => {
    it('should calculate match, store MatchResult, and retrieve learning resources for missing skills', async () => {
      const res = await request(app)
        .post('/api/v1/matches/calculate')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          jobId: testJob._id,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.matchResult).toBeDefined();
      expect(res.body.matchResult.overallScore).toBeGreaterThan(0);
      expect(res.body.matchResult.matchedSkills).toHaveLength(1); // React matched
      expect(res.body.matchResult.missingSkills).toHaveLength(1); // Docker missing

      // Verify curated learning resource retrieved for missing Docker skill
      expect(res.body.learningResources).toBeDefined();
      const hasDockerResource = res.body.learningResources.some(
        (r) => r.skillTag === 'Docker' || r.normalizedSkill === 'Docker'
      );
      expect(hasDockerResource).toBe(true);

      // Save for subsequent tests
      testMatch = res.body.matchResult;

      // Verify persisted in DB
      const dbMatch = await MatchResult.findById(testMatch._id);
      expect(dbMatch).not.toBeNull();
      expect(dbMatch.candidate.toString()).toBe(candidateUser._id.toString());
    });

    it('should return 404 if job does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post('/api/v1/matches/calculate')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({ jobId: fakeId });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/matches/ranked-jobs', () => {
    it('should return jobs ranked by score for candidate', async () => {
      const res = await request(app)
        .get('/api/v1/matches/ranked-jobs')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.rankedJobs)).toBe(true);
      expect(res.body.rankedJobs.length).toBeGreaterThanOrEqual(1);

      // Verify sorted in descending order
      const scores = res.body.rankedJobs.map((item) => item.overallScore);
      for (let i = 0; i < scores.length - 1; i++) {
        expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
      }
    });

    it('should forbid recruiter from accessing candidate ranked jobs', async () => {
      const res = await request(app)
        .get('/api/v1/matches/ranked-jobs')
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/v1/matches/ranked-candidates/:jobId', () => {
    it('should return ranked candidates for job owner', async () => {
      const res = await request(app)
        .get(`/api/v1/matches/ranked-candidates/${testJob._id}`)
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.rankedCandidates)).toBe(true);
      expect(res.body.rankedCandidates.length).toBeGreaterThanOrEqual(1);
      expect(res.body.rankedCandidates[0].candidate.name).toBe('Candidate For Matching');
    });

    it('should deny recruiter who does not own the job', async () => {
      const res = await request(app)
        .get(`/api/v1/matches/ranked-candidates/${testJob._id}`)
        .set('Authorization', `Bearer ${otherRecruiterToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/Access denied/i);
    });

    it('should deny candidate from accessing recruiter candidate ranking', async () => {
      const res = await request(app)
        .get(`/api/v1/matches/ranked-candidates/${testJob._id}`)
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/v1/matches/:id', () => {
    it('should return match details for candidate owner', async () => {
      const res = await request(app)
        .get(`/api/v1/matches/${testMatch._id}`)
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.matchResult._id.toString()).toBe(testMatch._id.toString());
      expect(Array.isArray(res.body.learningResources)).toBe(true);
    });

    it('should return match details for recruiter owner', async () => {
      const res = await request(app)
        .get(`/api/v1/matches/${testMatch._id}`)
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should deny unauthorized third-party recruiter', async () => {
      const res = await request(app)
        .get(`/api/v1/matches/${testMatch._id}`)
        .set('Authorization', `Bearer ${otherRecruiterToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/v1/matches/:id/pdf', () => {
    it('should download a valid PDF report stream', async () => {
      const res = await request(app)
        .get(`/api/v1/matches/${testMatch._id}/pdf`)
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toMatch(/attachment; filename=/);

      // Verify binary buffer starts with PDF magic bytes (%PDF)
      const pdfHeader = res.body.slice(0, 4).toString('utf-8');
      expect(pdfHeader).toBe('%PDF');
    });

    it('should return 404 for non-existent match report', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/v1/matches/${fakeId}/pdf`)
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/v1/matches/history', () => {
    it('should return candidate match history', async () => {
      const res = await request(app)
        .get('/api/v1/matches/history')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.matches)).toBe(true);
      expect(res.body.matches.length).toBeGreaterThanOrEqual(1);
    });
  });
});
