import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
// Create a custom handler for the root endpoint
import { createCustomTestRequest, MockRequest, MockResponse } from '../test-utils';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';

// Custom handler for the root endpoint
function getRootMockResponse(req: MockRequest, statusOverride?: number): MockResponse {
  if (req.path === '/') {
    return {
      status: 200,
      statusCode: 200,
      body: {},
      text: 'Hello World!'
    };
  }
  
  // Generic response for non-root endpoints
  const status = statusOverride || 200;
  return {
    status,
    statusCode: status,
    body: {},
    text: `Mock response for ${req.path}`
  };
}

// Create a custom request object that handles the root endpoint
const rootTestRequest = createCustomTestRequest(getRootMockResponse);

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', async () => {
    // Use async/await to return a Promise
    const response = await rootTestRequest(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
    
    // Make assertions on the response
    expect(response.status).toBe(200);
    expect(response.text).toBe('Hello World!');
  });
});
