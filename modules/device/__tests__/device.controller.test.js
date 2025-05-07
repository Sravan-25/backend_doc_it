const request = require('supertest');
const app = require('../../../app');
const User = require('../user.model');
const { connectDB, disconnectDB } = require('../../../config/db');
const { DEVICE } = require('../../../constants/messages');

describe('Device Controller', () => {
  let testDevice;

  beforeAll(async () => {
    await connectDB();
    testDevice = await request(app)
      .post('/api/v1/devices')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        deviceName: 'TestDevice001',
        publicIp: '192.168.1.100',
        passkey: 'securePass123',
      });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await disconnectDB();
  });

  describe('GET /devices', () => {
    it('should get all devices', async () => {
      const res = await request(app)
        .get('/api/v1/devices')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.message).toBe(DEVICE.LIST_RETRIEVED);
    });
  });

  describe('GET /devices/:id', () => {
    it('should get a single device', async () => {
      const res = await request(app)
        .get(`/api/v1/devices/${testDevice.body.data._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data._id).toBe(testDevice.body.data._id);
    });
  });
});
