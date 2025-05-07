const request = require('supertest');
const app = require('../../../app');
const User = require('../../users/user.model');
const { connectDB, disconnectDB } = require('../../../config/db');
const { AUTH } = require('../../../constants/messages');

describe('Auth Controller', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await disconnectDB();
  });

  describe('POST /signup', () => {
    it('should create a new user', async () => {
      const res = await request(app).post('/api/v1/auth/signup').send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.message).toBe(AUTH.ACCOUNT_CREATED);
    });
  });

  describe('POST /signin', () => {
    it('should login a user', async () => {
      const res = await request(app).post('/api/v1/auth/signin').send({
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.message).toBe(AUTH.LOGIN_SUCCESS);
    });
  });
});
