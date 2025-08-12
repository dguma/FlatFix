const request = require('supertest');
const mongoose = require('mongoose');
const appFactory = require('../testApp');

let app;

beforeAll(async () => {
  process.env.JWT_SECRET = 'testsecret';
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/zipfix_test';
  app = await appFactory();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('Auth flow', () => {
  test('register + login', async () => {
    const email = `user${Date.now()}@test.com`;
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email, password: 'pass1234' });
    expect(registerRes.status).toBe(201);
    expect(registerRes.body.token).toBeTruthy();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'pass1234' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeTruthy();
  });
});
