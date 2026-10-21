const request = require('supertest');
const app = require('../index');
const mongoose = require('mongoose');

describe('Task Management API Tests (CI Pipeline)', () => {
  afterAll(async () => {
    // Close mongoose connection after tests complete to ensure clean exit
    try {
      await mongoose.connection.close();
    } catch (err) {
      // ignore
    }
  });

  // Test 1: Verify root API documentation endpoint
  test('GET / returns 200 and welcome message', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain('Welcome to the Task Management RESTful API');
  });

  // Test 2: Fixed test - Verify GET /tasks endpoint returns status 200 (Practical 12 Step 6)
  test('GET /tasks returns 200', async () => {
    const res = await request(app).get('/tasks');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // Practical 13 Test 1: Validate missing title in AI generation
  test('POST /api/ai/generate-description returns 400 when title is missing', async () => {
    const res = await request(app)
      .post('/api/ai/generate-description')
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // Practical 13 Test 2: Verify graceful fallback when key is placeholder or invalid
  test('POST /api/ai/generate-description gracefully handles fallback without crashing (status 200)', async () => {
    const res = await request(app)
      .post('/api/ai/generate-description')
      .send({ title: 'Complete Web Dev Project' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('fallback');
    // If fallback is true, verify it includes a message
    if (res.body.fallback) {
      expect(res.body).toHaveProperty('message');
    } else {
      expect(typeof res.body.description).toBe('string');
    }
  }, 15000);
});

