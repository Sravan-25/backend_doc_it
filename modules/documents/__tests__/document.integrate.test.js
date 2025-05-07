const request = require('supertest');
const app = require('../../../app');
const Document = require('../document.model');
const User = require('../../user/user.model');
const { connectDB, disconnectDB } = require('../../../config/db');

describe('Document Integration', () => {
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
    await Document.deleteMany({});
    await User.deleteMany({});
    await disconnectDB();
  });

  describe('Full Document CRUD Flow', () => {
    let documentId;

    it('should create a document', async () => {
      const createRes = await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .field('name', 'Test Document')
        .attach('file', '__tests__/mocks/test.pdf'); // path to your test file

      expect(createRes.statusCode).toBe(201);
      expect(createRes.body.data._id).toBeDefined();
      documentId = createRes.body.data._id;
    });

    it('should get the document by ID', async () => {
      const getRes = await request(app)
        .get(`/api/v1/documents/${documentId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(getRes.statusCode).toBe(200);
      expect(getRes.body.data.name).toBe('Test Document');
    });

    it('should update the document name', async () => {
      const updateRes = await request(app)
        .put(`/api/v1/documents/${documentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Document Name' });

      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body.data.name).toBe('Updated Document Name');
    });

    it('should delete the document', async () => {
      const deleteRes = await request(app)
        .delete(`/api/v1/documents/${documentId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(deleteRes.statusCode).toBe(200);
    });

    it('should return 404 for deleted document', async () => {
      const getRes = await request(app)
        .get(`/api/v1/documents/${documentId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(getRes.statusCode).toBe(404);
    });
  });
});
