const request = require('supertest');
const app = require('../../../app');
const User = require('../../users/user.model');
const { connectDB, disconnectDB } = require('../../../config/db');

describe('Auth Integration', () => {
  let testUser;

  beforeAll(async () => {
    await connectDB();
    testUser = await User.create({
      name: 'Integration Test',
      email: 'integration@test.com',
      password: 'Password123!',
      verified: true,
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await disconnectDB();
  });

  describe('Full Auth Flow', () => {
    it('should complete signup, verification and login', async () => {
      const signupRes = await request(app).post('/api/v1/auth/signup').send({
        name: 'Flow Test',
        email: 'flow@test.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });
      expect(signupRes.statusCode).toEqual(201);

      const user = await User.findOne({ email: 'flow@test.com' });
      const { verificationCode } = user;

      const verifyRes = await request(app).post('/api/v1/auth/verify').send({
        email: 'flow@test.com',
        code: verificationCode,
      });
      expect(verifyRes.statusCode).toEqual(200);

      const loginRes = await request(app).post('/api/v1/auth/signin').send({
        email: 'flow@test.com',
        password: 'Password123!',
      });
      expect(loginRes.statusCode).toEqual(200);
      expect(loginRes.body).toHaveProperty('token');
    });
  });
});
