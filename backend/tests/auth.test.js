const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/server');
const User = require('../src/models/User');
const CandidateProfile = require('../src/models/CandidateProfile');

const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/skillmatch_test';

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI, {
    serverSelectionTimeoutMS: 5000,
  });
  // Clean test collections before running
  await User.deleteMany({ email: /@testauth\.com$/ });
  await CandidateProfile.deleteMany({});
});

afterAll(async () => {
  await User.deleteMany({ email: /@testauth\.com$/ });
  await CandidateProfile.deleteMany({});
  await mongoose.connection.close();
});

describe('Authentication & Authorization API — Phase 2', () => {
  const candidateUser = {
    name: 'Jane Candidate',
    email: 'jane@testauth.com',
    password: 'Password123!',
    role: 'candidate',
  };

  const recruiterUser = {
    name: 'Bob Recruiter',
    email: 'bob@testauth.com',
    password: 'RecruiterPass123!',
    role: 'recruiter',
  };

  let candidateToken = '';
  let recruiterToken = '';

  describe('POST /api/v1/auth/register', () => {
    it('should successfully register a candidate and create their candidate profile', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(candidateUser);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(candidateUser.email.toLowerCase());
      expect(res.body.user.role).toBe('candidate');
      expect(res.body.user.password).toBeUndefined(); // Password hash must never leak!

      candidateToken = res.body.token;

      // Verify CandidateProfile document exists
      const profile = await CandidateProfile.findOne({ user: res.body.user._id });
      expect(profile).not.toBeNull();
    });

    it('should successfully register a recruiter', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(recruiterUser);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe('recruiter');

      recruiterToken = res.body.token;
    });

    it('should reject registration with duplicate email address with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(candidateUser);

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('should reject registration with password shorter than 8 characters', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Short Pass',
          email: 'short@testauth.com',
          password: '123',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/at least 8 characters/i);
    });

    it('should reject registration with invalid email format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Invalid Email',
          email: 'not-an-email',
          password: 'ValidPassword123!',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/valid email/i);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should log in an existing user with correct credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: candidateUser.email,
          password: candidateUser.password,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(candidateUser.email.toLowerCase());
      expect(res.body.user.password).toBeUndefined();
    });

    it('should reject login with wrong password with 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: candidateUser.email,
          password: 'WrongPassword!',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should reject login for non-existent email with 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@testauth.com',
          password: 'SomePassword123!',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });
  });

  describe('GET /api/v1/auth/me (Protected Route)', () => {
    it('should return user details and candidate profile when given valid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(candidateUser.email.toLowerCase());
      expect(res.body.profile).toBeDefined();
    });

    it('should reject requests with missing Authorization header with 401', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/missing or invalid/i);
    });

    it('should reject requests with malformed or invalid token with 401', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token-xyz');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid/i);
    });
  });

  describe('Role-based Authorization', () => {
    it('should reject candidate from accessing a recruiter-only endpoint with 403', async () => {
      const res = await request(app)
        .get('/api/v1/auth/role-test/recruiter')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Forbidden/i);
    });

    it('should allow recruiter to access a recruiter-only endpoint', async () => {
      const res = await request(app)
        .get('/api/v1/auth/role-test/recruiter')
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Welcome recruiter');
    });

    it('should allow candidate to access a candidate-only endpoint', async () => {
      const res = await request(app)
        .get('/api/v1/auth/role-test/candidate')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Welcome candidate');
    });

    it('should reject recruiter from accessing a candidate-only endpoint with 403', async () => {
      const res = await request(app)
        .get('/api/v1/auth/role-test/candidate')
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Forbidden/i);
    });
  });
});
