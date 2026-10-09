const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/server');
const User = require('../src/models/User');
const Job = require('../src/models/Job');

const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/skillmatch_test';

let recruiterToken = '';
let recruiterUser = null;
let otherRecruiterToken = '';
let candidateToken = '';
let testJobId = null;

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI, { serverSelectionTimeoutMS: 5000 });
  await User.deleteMany({ email: /@jobcrud\.com$/ });
  await Job.deleteMany({ company: 'JobCrud Corp' });

  // Create primary recruiter
  const recRes = await request(app).post('/api/v1/auth/register').send({
    name: 'Recruiter Jobs',
    email: 'rec@jobcrud.com',
    password: 'Password123!',
    role: 'recruiter',
  });
  recruiterToken = recRes.body.token;
  recruiterUser = recRes.body.user;

  // Create second recruiter
  const otherRecRes = await request(app).post('/api/v1/auth/register').send({
    name: 'Other Recruiter Jobs',
    email: 'otherrec@jobcrud.com',
    password: 'Password123!',
    role: 'recruiter',
  });
  otherRecruiterToken = otherRecRes.body.token;

  // Create candidate
  const candRes = await request(app).post('/api/v1/auth/register').send({
    name: 'Candidate Jobs',
    email: 'cand@jobcrud.com',
    password: 'Password123!',
    role: 'candidate',
  });
  candidateToken = candRes.body.token;
});

afterAll(async () => {
  await User.deleteMany({ email: /@jobcrud\.com$/ });
  await Job.deleteMany({ company: 'JobCrud Corp' });
  await mongoose.connection.close();
});

describe('Job Management API — Job CRUD & RBAC', () => {
  describe('POST /api/v1/jobs', () => {
    it('should allow recruiter to create a new job posting', async () => {
      const res = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          title: 'Senior Backend Engineer',
          company: 'JobCrud Corp',
          location: 'Remote',
          description: 'We are seeking an experienced Node.js and MongoDB backend engineer.',
          requiredSkills: [
            { skillName: 'Node.js', normalizedName: 'Node.js', category: 'Backend', importance: 'required' },
            { skillName: 'MongoDB', normalizedName: 'MongoDB', category: 'Database', importance: 'required' },
          ],
          preferredSkills: [
            { skillName: 'Docker', normalizedName: 'Docker', category: 'DevOps', importance: 'preferred' },
          ],
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.job).toBeDefined();
      expect(res.body.job.title).toBe('Senior Backend Engineer');
      expect(res.body.job.requiredSkills).toHaveLength(2);
      testJobId = res.body.job._id;
    });

    it('should deny candidate from creating a job', async () => {
      const res = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          title: 'Illegal Job Post',
          company: 'JobCrud Corp',
          description: 'Candidate posting',
        });

      expect(res.statusCode).toBe(403);
    });

    it('should validate missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          title: 'Incomplete Post',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/jobs', () => {
    it('should list all open jobs', async () => {
      const res = await request(app).get('/api/v1/jobs');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.jobs)).toBe(true);
      expect(res.body.jobs.length).toBeGreaterThanOrEqual(1);
    });

    it('should get job by ID', async () => {
      const res = await request(app).get(`/api/v1/jobs/${testJobId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.job._id.toString()).toBe(testJobId.toString());
    });
  });

  describe('PUT /api/v1/jobs/:id', () => {
    it('should allow job owner to update posting', async () => {
      const res = await request(app)
        .put(`/api/v1/jobs/${testJobId}`)
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          title: 'Staff Backend Engineer',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.job.title).toBe('Staff Backend Engineer');
    });

    it('should deny other recruiter from updating the job', async () => {
      const res = await request(app)
        .put(`/api/v1/jobs/${testJobId}`)
        .set('Authorization', `Bearer ${otherRecruiterToken}`)
        .send({
          title: 'Hacked Title',
        });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('DELETE /api/v1/jobs/:id', () => {
    it('should deny non-owner recruiter from deleting the job', async () => {
      const res = await request(app)
        .delete(`/api/v1/jobs/${testJobId}`)
        .set('Authorization', `Bearer ${otherRecruiterToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('should allow owner recruiter to delete the job', async () => {
      const res = await request(app)
        .delete(`/api/v1/jobs/${testJobId}`)
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await Job.findById(testJobId);
      expect(check).toBeNull();
    });
  });
});
