import request from 'supertest';
import { createApp } from '../src/app';

describe('App smoke tests', () => {
  const app = createApp();

  it('returns health ok', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, message: 'OK' });
  });

  it('serves openapi json', async () => {
    const response = await request(app).get('/docs/json');

    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe('3.0.3');
    expect(response.body.info.title).toBe('E-Commerce API');
  });
});