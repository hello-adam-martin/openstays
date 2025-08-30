import request from 'supertest';
import { Express } from 'express';
import { createApp } from '../src/app';
import { pool } from '../src/database';

describe('Properties API', () => {
  let app: Express;

  beforeAll(() => {
    app = createApp();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('GET /v1/properties', () => {
    it('should return properties list without authentication', async () => {
      const response = await request(app)
        .get('/v1/properties')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('next_cursor');
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/v1/properties?limit=5')
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should filter by region_id', async () => {
      const response = await request(app)
        .get('/v1/properties?region_id=test-region')
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });

    it('should handle address masking', async () => {
      const response = await request(app)
        .get('/v1/properties?address_masking=true')
        .expect(200);

      if (response.body.data.length > 0) {
        const property = response.body.data[0];
        expect(property).toHaveProperty('public_address');
        expect(property).toHaveProperty('public_coordinates');
        expect(property).not.toHaveProperty('address');
        expect(property).not.toHaveProperty('coordinates');
      }
    });

    it('should validate query parameters', async () => {
      const response = await request(app)
        .get('/v1/properties?limit=999')
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /v1/properties/:id', () => {
    it('should return 404 for non-existent property', async () => {
      const response = await request(app)
        .get('/v1/properties/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(response.body.code).toBe('NOT_FOUND');
    });

    it('should return property details when exists', async () => {
      // This would require test data to be present
      // In a real test, you'd seed the database first
    });
  });

  describe('Health checks', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return readiness status', async () => {
      const response = await request(app)
        .get('/ready')
        .expect((res) => {
          // Accept either 200 or 503 depending on database state
          expect([200, 503]).toContain(res.status);
        });

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('services');
    });
  });
});