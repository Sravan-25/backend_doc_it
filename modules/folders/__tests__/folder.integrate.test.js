const request = require('supertest');
const app = require('../../../app');
const Folder = require('../folder.model');
const { connectDB, disconnectDB } = require('../../../config/db');

describe('Folder Integration', () => {
  let testDevice;
  let authToken;

  beforeAll(async () => {
    await connectDB();
    testDevice = await Folder.create({
      name: 'Test User',
      type: 'test',
    });
    authToken = testDevice.generateToken();
  });

  afterAll(async () => {
    await Folder.deleteMany({});
    await disconnectDB();
  });

  describe('Full Folder CRUD Flow', () => {
    it('should complete create, read, update, delete cycle', async () => {
      const newFolder = await Folder.create({
        name: 'CRUD Test Device',
        name: 'Test User',
        type: 'test',
      });
      expect(newFolder._id).toBeDefined();

      const getRes = await request(app)
        .get(`/api/v1/folders/${newFolder._id}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(getRes.statusCode).toEqual(200);

      const updateRes = await request(app)
        .put(`/api/v1/users/${newFolder._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' });
      expect(updateRes.statusCode).toEqual(200);
      expect(updateRes.body.data.name).toBe('Updated Name');

      const deleteRes = await request(app)
        .delete(`/api/v1/users/${newFolder._id}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(deleteRes.statusCode).toEqual(200);

      const verifyRes = await request(app)
        .get(`/api/v1/folders/${newFolder._id}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(verifyRes.statusCode).toEqual(404);
    });
  });
});
