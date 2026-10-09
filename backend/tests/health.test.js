const request = require('supertest');
const app = require('../src/server');

describe('GET /api/v1/health', () => {
  it('should return 200 with healthy status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('healthy');
  });
});
