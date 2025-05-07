const request = require('supertest');
const app = require('../../../app');
const Image = require('../document.model');
const User = require('../../user/user.model');
const { connectDB, disconnectDB } = require('../../../config/db');
const { IMAGE } = require('../../../constants/messages');

describe('Image Controller', () => {
  let testUser;
  let authToken;
  let createdImage;

  beforeAll(async () => {
    await connectDB();

    testUser = await User.create({
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'test1234',
    });
    authToken = testUser.generateToken();

    const res = await request(app)
      .post('/api/v1/images')
      .set('Authorization', `Bearer ${authToken}`)
      .field('name', 'Sample Image')
      .attach('file', '__tests__/mocks/test.pdf');

    createdImage = res.body.data;
  });

  afterAll(async () => {
    await Image.deleteMany({});
    await User.deleteMany({});
    await disconnectDB();
  });

  describe('GET /images', () => {
    it('should get all images', async () => {
      const res = await request(app)
        .get('/api/v1/images')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.message).toBe(IMAGE.IMAGE_LIST_RETRIEVED);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /images/:id', () => {
    it('should get a single image', async () => {
      const res = await request(app)
        .get(`/api/v1/images/${createdImage._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data._id).toBe(createdImage._id);
    });
  });
});
