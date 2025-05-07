const request = require('supertest');
const app = require('../../../app');
const User = require('../user.model');
const { connectDB, disconnectDB } = require('../../../config/db');

describe('User Integration', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    await connectDB();
    testUser = await User.create({
      name: 'Integration User',
      email: 'integration@test.com',
      password: 'Password123!',
      verified: true,
    });
    authToken = testUser.generateToken();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await disconnectDB();
  });

  describe('Full User CRUD Flow', () => {
    it('should complete create, read, update, delete cycle', async () => {
      const newUser = await User.create({
        name: 'CRUD Test',
        email: 'crud@test.com',
        password: 'Password123!',
        verified: true,
      });
      expect(newUser._id).toBeDefined();

      const getRes = await request(app)
        .get(`/api/v1/users/${newUser._id}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(getRes.statusCode).toEqual(200);

      const updateRes = await request(app)
        .put(`/api/v1/users/${newUser._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' });
      expect(updateRes.statusCode).toEqual(200);
      expect(updateRes.body.data.name).toBe('Updated Name');

      const deleteRes = await request(app)
        .delete(`/api/v1/users/${newUser._id}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(deleteRes.statusCode).toEqual(200);

      const verifyRes = await request(app)
        .get(`/api/v1/users/${newUser._id}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(verifyRes.statusCode).toEqual(404);
    });
  });
});
