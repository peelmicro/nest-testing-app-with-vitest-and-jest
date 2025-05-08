/**
 * Jest setup file - framework-agnostic configuration
 */
import { testRunner } from './test-utils';

// Create mock app with all necessary methods
const createMockApp = () => ({
  useGlobalPipes: jest.fn(),
  setGlobalPrefix: jest.fn(),
  listen: jest.fn().mockResolvedValue(undefined),
  // Add other common app methods as needed
  enableCors: jest.fn(),
  useGlobalFilters: jest.fn(),
  useGlobalInterceptors: jest.fn(),
  useGlobalGuards: jest.fn(),
});

// Create a shared mockApp that will be consistent across all tests
const mockApp = createMockApp();

// Mock NestJS core to prevent actual app startup
jest.mock('@nestjs/core', () => {
  const originalModule = jest.requireActual('@nestjs/core');
  return {
    ...originalModule,
    NestFactory: {
      ...originalModule.NestFactory,
      create: jest.fn().mockResolvedValue(mockApp),
    },
  };
});

// Mock ValidationPipe
jest.mock('@nestjs/common', () => {
  const originalModule = jest.requireActual('@nestjs/common');
  return {
    ...originalModule,
    ValidationPipe: jest.fn().mockImplementation(() => ({
      transform: jest.fn().mockReturnValue(true),
    })),
  };
});

// Store original env
const originalEnv = { ...process.env };

// Reset before each test
beforeEach(() => {
  jest.clearAllMocks();
  process.env = { ...originalEnv };
  delete process.env.PORT;
});

// Cleanup after tests
afterEach(() => {
  process.env = originalEnv;
}); 