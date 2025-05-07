const request = require('supertest');
const app = require('../../../app');
const Image = require('../image.model');
const User = require('../../user/user.model');
const { connectDB, disconnectDB } = require('../../../config/db');

describe('Image Integration', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    await connectDB();
    testUser = await User.create({
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'test1234',
    });
    authToken = testUser.generateToken();
  });

  afterAll(async () => {
    await Image.deleteMany({});
    await User.deleteMany({});
    await disconnectDB();
  });

  describe('Full Image CRUD Flow', () => {
    let imageId;

    it('should create a image', async () => {
      const createRes = await request(app)
        .post('/api/v1/images')
        .set('Authorization', `Bearer ${authToken}`)
        .field('name', 'Test Image')
        .attach('file', '__tests__/mocks/test.pdf');

      expect(createRes.statusCode).toBe(201);
      expect(createRes.body.data._id).toBeDefined();
      imageId = createRes.body.data._id;
    });

    it('should get the image by ID', async () => {
      const getRes = await request(app)
        .get(`/api/v1/images/${imageId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(getRes.statusCode).toBe(200);
      expect(getRes.body.data.name).toBe('Test Image');
    });

    it('should update the image name', async () => {
      const updateRes = await request(app)
        .put(`/api/v1/images/${imageId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Image Name' });

      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body.data.name).toBe('Updated Image Name');
    });

    it('should delete the image', async () => {
      const deleteRes = await request(app)
        .delete(`/api/v1/images/${imageId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(deleteRes.statusCode).toBe(200);
    });

    it('should return 404 for deleted image', async () => {
      const getRes = await request(app)
        .get(`/api/v1/images/${imageId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(getRes.statusCode).toBe(404);
    });
  });
});
