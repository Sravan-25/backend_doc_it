const request = require('supertest');
const app = require('../../../app');
const Device = require('../../users/user.model');
const { connectDB, disconnectDB } = require('../../../config/db');

describe('Device Integration', () => {
  let testDevice;
  let authToken;

  beforeAll(async () => {
    await connectDB();
    testDevice = await Device.create({
      deviceName: 'TestDevice001',
      publicIp: '192.168.1.100',
      passkey: 'securePass123',
    });
    authToken = testDevice.generateToken();
  });

  afterAll(async () => {
    await Device.deleteMany({});
    await disconnectDB();
  });

  describe('Full Device CRUD Flow', () => {
    it('should complete create, read, update, delete cycle', async () => {
      const newDevice = await Device.create({
        name: 'CRUD Test Device',
        deviceName: 'TestDevice001',
        publicIp: '192.168.1.100',
        passkey: 'securePass123',
      });
      expect(newDevice._id).toBeDefined();

      const getRes = await request(app)
        .get(`/api/v1/devices/${newDevice._id}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(getRes.statusCode).toEqual(200);

      const updateRes = await request(app)
        .put(`/api/v1/devices/${newDevice._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Device Name' });
      expect(updateRes.statusCode).toEqual(200);
      expect(updateRes.body.data.name).toBe('Updated Device Name');

      const deleteRes = await request(app)
        .delete(`/api/v1/devices/${newDevice._id}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(deleteRes.statusCode).toEqual(200);

      const verifyRes = await request(app)
        .get(`/api/v1/devices/${newDevice._id}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(verifyRes.statusCode).toEqual(404);
    });
  });
});
