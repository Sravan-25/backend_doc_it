const request = require('supertest');
const app = require('../../../app');
const Document = require('../document.model');
const User = require('../../user/user.model');
const { connectDB, disconnectDB } = require('../../../config/db');
const { DOCUMENT } = require('../../../constants/messages');

describe('Document Controller', () => {
  let testUser;
  let authToken;
  let createdDocument;

  beforeAll(async () => {
    await connectDB();

    testUser = await User.create({
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'test1234',
    });
    authToken = testUser.generateToken();

    const res = await request(app)
      .post('/api/v1/documents')
      .set('Authorization', `Bearer ${authToken}`)
      .field('name', 'Sample Document')
      .attach('file', '__tests__/mocks/test.pdf');

    createdDocument = res.body.data;
  });

  afterAll(async () => {
    await Document.deleteMany({});
    await User.deleteMany({});
    await disconnectDB();
  });

  describe('GET /documents', () => {
    it('should get all documents', async () => {
      const res = await request(app)
        .get('/api/v1/documents')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.message).toBe(DOCUMENT.LIST_RETRIEVED);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /documents/:id', () => {
    it('should get a single document', async () => {
      const res = await request(app)
        .get(`/api/v1/documents/${createdDocument._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data._id).toBe(createdDocument._id);
    });
  });
});
