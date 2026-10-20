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

  // Test 2: Deliberately broken test for Practical 12 Step 5 demonstration
  test('GET /tasks returns 200', async () => {
    const res = await request(app).get('/tasks');
    // Deliberately broken assertion to trigger CI pipeline failure (Red X)
    expect(res.statusCode).toBe(999);
  });
});
