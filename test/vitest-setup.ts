/**
 * Vitest setup file - framework-agnostic configuration
 */
import { vi } from 'vitest';

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