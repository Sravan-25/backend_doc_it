const request = require('supertest');
const app = require('../../../app');
const User = require('../user.model');
const { connectDB, disconnectDB } = require('../../../config/db');
const { USER } = require('../../../constants/messages');

describe('User Controller', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    await connectDB();
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
      verified: true,
    });
    authToken = testUser.generateToken();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await disconnectDB();
  });

  describe('GET /users', () => {
    it('should get all users', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.message).toBe(USER.LIST_RETRIEVED);
    });
  });

  describe('GET /users/:id', () => {
    it('should get a single user', async () => {
      const res = await request(app)
        .get(`/api/v1/users/${testUser._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data._id).toBe(testUser._id.toString());
    });
  });
});
