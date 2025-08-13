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

describe('Service status transitions', () => {
  test('technician can set en-route and on-location', async () => {
    const appLocal = app;
    const customerEmail = `cust${Date.now()}@test.com`;
    const techEmail = `tech${Date.now()}@test.com`;
    // Register customer
    const custRes = await request(appLocal).post('/api/auth/register').send({ name:'Cust', email: customerEmail, password:'pass1234' });
    expect(custRes.status).toBe(201);
    const custToken = custRes.body.token;
    // Register technician
    const techRes = await request(appLocal).post('/api/auth/register').send({ name:'Tech', email: techEmail, password:'pass1234', userType:'technician' });
    expect(techRes.status).toBe(201);
    const techToken = techRes.body.token;
    // Customer creates request
    const createRes = await request(appLocal)
      .post('/api/services/request')
      .set('Authorization', `Bearer ${custToken}`)
      .send({
        serviceType: 'air-inflation',
        location: { address: '123 Test St' },
        description: 'Need air'
      });
    expect(createRes.status).toBe(201);
    const reqId = createRes.body.request._id;
    // Technician claims
    const claimRes = await request(appLocal)
      .post(`/api/services/claim/${reqId}`)
      .set('Authorization', `Bearer ${techToken}`);
    expect(claimRes.status).toBe(200);
    // Technician sets en-route
    const enRouteRes = await request(appLocal)
      .patch(`/api/services/status/${reqId}`)
      .set('Authorization', `Bearer ${techToken}`)
      .send({ status: 'en-route' });
    expect(enRouteRes.status).toBe(200);
    expect(enRouteRes.body.request.status).toBe('en-route');
    // Technician sets on-location (alias test)
    const onLocRes = await request(appLocal)
      .patch(`/api/services/status/${reqId}`)
      .set('Authorization', `Bearer ${techToken}`)
      .send({ status: 'on-location' });
    expect(onLocRes.status).toBe(200);
    expect(onLocRes.body.request.status).toBe('on-location');
  });
});
