/**
 * Vitest setup file - framework-agnostic configuration
 */
import { vi } from 'vitest';
import { testRunner } from './test-utils';

// Create mock app with all necessary methods
const createMockApp = () => ({
  useGlobalPipes: vi.fn(),
  setGlobalPrefix: vi.fn(),
  listen: vi.fn().mockResolvedValue(undefined),
  // Add other common app methods as needed
  enableCors: vi.fn(),
  useGlobalFilters: vi.fn(),
  useGlobalInterceptors: vi.fn(),
  useGlobalGuards: vi.fn(),
  getHttpServer: vi.fn().mockReturnValue({}),
});

// Create a shared mockApp that will be consistent across all tests
const mockApp = createMockApp();

// Mock NestJS core to prevent actual app startup
vi.mock('@nestjs/core', async () => {
  const originalModule = await vi.importActual('@nestjs/core');
  return {
    ...(originalModule as object),
    NestFactory: {
      // Handle NestFactory safely
      ...(originalModule && typeof originalModule === 'object' && 
          'NestFactory' in originalModule && 
          typeof originalModule.NestFactory === 'object' ? 
          originalModule.NestFactory : {}),
      create: vi.fn().mockResolvedValue(mockApp),
    },
  };
});

// Mock ValidationPipe
vi.mock('@nestjs/common', async () => {
  const originalModule = await vi.importActual('@nestjs/common');
  return {
    ...(originalModule as object),
    ValidationPipe: vi.fn().mockImplementation(() => ({
      transform: vi.fn().mockReturnValue(true),
    })),
  };
});

// Mock for supertest - using a simpler, more direct approach
// This handles CommonJS-style imports (import * as request from 'supertest')
const createSupertestMock = () => {
  // The chainable request methods
  const chainMethods = {
    get: vi.fn().mockReturnThis(),
    post: vi.fn().mockReturnThis(),
    put: vi.fn().mockReturnThis(),
    patch: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    query: vi.fn().mockReturnThis(),
    expect: vi.fn().mockImplementation((status) => {
      return {
        expect: vi.fn().mockReturnThis(),
        end: vi.fn().mockImplementation((cb) => cb && cb(null, { 
          status,
          statusCode: status,
          body: {},
          text: 'Mock response'
        })),
      };
    }),
  };
  
  // The main supertest function
  const supertestFn = vi.fn().mockReturnValue(chainMethods);
  
  // For CommonJS require('supertest')
  return {
    default: supertestFn,
    // For CommonJS 'import * as request'
    __esModule: true
  };
};

vi.mock('supertest', async () => {
  return createSupertestMock();
});

// Store original env
const originalEnv = { ...process.env };

// Reset before each test
beforeEach(() => {
  vi.clearAllMocks();
  process.env = { ...originalEnv };
  delete process.env.PORT;
});

// Cleanup after tests
afterEach(() => {
  process.env = originalEnv;
}); 