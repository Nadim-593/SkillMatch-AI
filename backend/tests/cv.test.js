const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/server');
const User = require('../src/models/User');
const CVDocument = require('../src/models/CVDocument');
const CandidateProfile = require('../src/models/CandidateProfile');

// Mock aiService for deterministic controller & route testing
jest.mock('../src/services/aiService', () => ({
  extractDocumentText: jest.fn(async (buffer, filename) => {
    if (filename.includes('corrupted') || buffer.length === 0) {
      const err = new Error('Invalid or corrupted document');
      err.statusCode = 400;
      throw err;
    }
    return 'Jane Doe is a Software Engineer experienced in React, TypeScript, Node.js, and MongoDB.';
  }),
  extractCvSkills: jest.fn(async (text, candidateId) => {
    if (!text || text.trim().length < 15) {
      const err = new Error('CV text is too short or empty');
      err.statusCode = 400;
      throw err;
    }
    return [
      {
        skill_name: 'React',
        normalized_name: 'React',
        category: 'Frontend',
        evidence: 'experienced in React',
        confidence: 0.9,
      },
      {
        skill_name: 'TypeScript',
        normalized_name: 'TypeScript',
        category: 'Frontend',
        evidence: 'TypeScript developer',
        confidence: 0.9,
      },
      {
        skill_name: 'Node.js',
        normalized_name: 'Node.js',
        category: 'Backend',
        evidence: 'Node.js backend',
        confidence: 0.85,
      },
      {
        skill_name: 'MongoDB',
        normalized_name: 'MongoDB',
        category: 'Database',
        evidence: 'MongoDB database',
        confidence: 0.85,
      },
    ];
  }),
}));

const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/skillmatch_test';

let candidateToken = '';
let recruiterToken = '';
let candidateUser = null;

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI, { serverSelectionTimeoutMS: 5000 });
  await User.deleteMany({ email: /@cvtest\.com$/ });
  await CandidateProfile.deleteMany({});
  await CVDocument.deleteMany({});

  // Create candidate
  const candRes = await request(app).post('/api/v1/auth/register').send({
    name: 'CV Tester Candidate',
    email: 'cand@cvtest.com',
    password: 'Password123!',
    role: 'candidate',
  });
  candidateToken = candRes.body.token;
  candidateUser = candRes.body.user;

  // Create recruiter
  const recRes = await request(app).post('/api/v1/auth/register').send({
    name: 'CV Tester Recruiter',
    email: 'rec@cvtest.com',
    password: 'Password123!',
    role: 'recruiter',
  });
  recruiterToken = recRes.body.token;
});

afterAll(async () => {
  await User.deleteMany({ email: /@cvtest\.com$/ });
  await CandidateProfile.deleteMany({});
  await CVDocument.deleteMany({});
  await mongoose.connection.close();
});

describe('CV Processing & Skill Extraction API — Phases 4 & 5', () => {
  describe('POST /api/v1/cvs/upload', () => {
    it('should upload a valid PDF CV and return extracted skills', async () => {
      const dummyPdf = Buffer.from('%PDF-1.4 dummy pdf content for testing');

      const res = await request(app)
        .post('/api/v1/cvs/upload')
        .set('Authorization', `Bearer ${candidateToken}`)
        .attach('file', dummyPdf, 'resume.pdf');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.cv).toBeDefined();
      expect(res.body.cv.extractionStatus).toBe('completed');
      expect(res.body.extractedSkills).toHaveLength(4);

      // Verify DB record
      const dbCv = await CVDocument.findById(res.body.cv._id);
      expect(dbCv).not.toBeNull();
      expect(dbCv.originalFilename).toBe('resume.pdf');
    });

    it('should upload a valid DOCX CV and return extracted skills', async () => {
      const dummyDocx = Buffer.from('dummy docx binary stream');

      const res = await request(app)
        .post('/api/v1/cvs/upload')
        .set('Authorization', `Bearer ${candidateToken}`)
        .attach('file', dummyDocx, 'resume.docx');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.cv.originalFilename).toBe('resume.docx');
    });

    it('should reject invalid file types (.exe, .png) with 400 Bad Request', async () => {
      const dummyExe = Buffer.from('executable binary code');

      const res = await request(app)
        .post('/api/v1/cvs/upload')
        .set('Authorization', `Bearer ${candidateToken}`)
        .attach('file', dummyExe, 'malicious.exe');

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Invalid file type/i);
    });

    it('should reject upload when no file is provided', async () => {
      const res = await request(app)
        .post('/api/v1/cvs/upload')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/No document file uploaded/i);
    });

    it('should reject recruiter from uploading candidate CV with 403 Forbidden', async () => {
      const dummyPdf = Buffer.from('%PDF-1.4 recruiter upload test');

      const res = await request(app)
        .post('/api/v1/cvs/upload')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .attach('file', dummyPdf, 'resume.pdf');

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should handle corrupt document extraction gracefully', async () => {
      const dummyCorrupted = Buffer.from('corrupted');

      const res = await request(app)
        .post('/api/v1/cvs/upload')
        .set('Authorization', `Bearer ${candidateToken}`)
        .attach('file', dummyCorrupted, 'corrupted.pdf');

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Failed to extract text/i);
    });
  });

  describe('POST /api/v1/cvs/manual-text', () => {
    it('should process valid pasted CV text and extract skills', async () => {
      const sampleText = 'Full Stack Developer with 4 years experience in React, TypeScript, Node.js, and MongoDB database.';

      const res = await request(app)
        .post('/api/v1/cvs/manual-text')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({ text: sampleText });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.cv).toBeDefined();
      expect(res.body.extractedSkills).toHaveLength(4);
    });

    it('should reject too short manual text with 400', async () => {
      const res = await request(app)
        .post('/api/v1/cvs/manual-text')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({ text: 'too short' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/too short/i);
    });
  });

  describe('GET /api/v1/cvs/my-cv', () => {
    it('should retrieve the candidate active CV', async () => {
      const res = await request(app)
        .get('/api/v1/cvs/my-cv')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.cv).toBeDefined();
    });
  });

  describe('PUT /api/v1/candidates/profile/skills (Review Interface)', () => {
    it('should save confirmed and corrected skills to candidate profile', async () => {
      const confirmedSkills = [
        {
          skillName: 'React',
          normalizedName: 'React',
          category: 'Frontend',
          proficiency: 'advanced',
          evidence: '4 years React experience',
          confidence: 0.95,
        },
        {
          skillName: 'TypeScript',
          normalizedName: 'TypeScript',
          category: 'Frontend',
          proficiency: 'intermediate',
          evidence: 'Production TypeScript',
          confidence: 0.9,
        },
        {
          skillName: 'Custom Python Skill',
          normalizedName: 'Python',
          category: 'Programming Language',
          proficiency: 'expert',
          evidence: 'Manually added by candidate',
          confidence: 1.0,
        },
      ];

      const res = await request(app)
        .put('/api/v1/candidates/profile/skills')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          headline: 'Full Stack Software Engineer',
          summary: 'Passionate about building scalable web applications',
          skills: confirmedSkills,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.profile.confirmedSkills).toHaveLength(3);
      expect(res.body.profile.profileCompleted).toBe(true);
      expect(res.body.profile.headline).toBe('Full Stack Software Engineer');

      // Verify persisted in MongoDB
      const profileInDb = await CandidateProfile.findOne({ user: candidateUser._id });
      expect(profileInDb.confirmedSkills).toHaveLength(3);
      expect(profileInDb.profileCompleted).toBe(true);
    });

    it('should reject invalid skills payload (not an array) with 400', async () => {
      const res = await request(app)
        .put('/api/v1/candidates/profile/skills')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({ skills: 'not-an-array' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/array/i);
    });
  });
});
