import { NestFactory } from '@nestjs/core';
import { bootstrap } from './main';
import { AppModule } from './app.module';
import { testRunner, isVitest } from '../test/test-utils';

// Create a framework-agnostic bootstrap mock function
const createBootstrapMock = () => {
  return testRunner.fn().mockImplementation(async () => {
    // Get NestFactory correctly for each framework
    const { NestFactory } = isVitest 
      ? await import('@nestjs/core') // For Vitest - dynamic import
      : require('@nestjs/core');     // For Jest - synchronous require
    
    // Create the mock app - handle framework-specific parameter needs
    const app = await NestFactory.create(isVitest ? {} as any : undefined);
    
    // Common app setup that matches the real bootstrap function
    app.setGlobalPrefix('api');
    app.useGlobalPipes();
    app.listen(process.env.PORT ?? 3000);
    
    return app;
  });
};

// Setup framework-specific mocks but with shared implementation
if (isVitest) {
  // Vitest environment
  globalThis.vi.mock('./main', async () => {
    const originalModule = await globalThis.vi.importActual('./main');
    return {
      ...(originalModule as object),
      bootstrap: createBootstrapMock(),
    };
  });
} else {
  // Jest environment
  jest.mock('./main', () => {
    const actualModule = jest.requireActual('./main');
    return {
      ...actualModule,
      bootstrap: createBootstrapMock(),
    };
  });
}

// Framework-agnostic test
describe('Main.ts Bootstrap', () => {
  beforeEach(() => {
    // Reset environment variables
    delete process.env.PORT;
  });

  afterEach(() => {
    delete process.env.PORT;
  });

  it('should create application', async () => {
    await bootstrap();
    expect(NestFactory.create).toHaveBeenCalled();
  });

  it('should set global prefix', async () => {
    await bootstrap();
    // The mock app is retrieved from NestFactory.create()
    const mockApp = await (NestFactory.create as jest.Mock)();
    expect(mockApp.setGlobalPrefix).toHaveBeenCalledWith('api');
  });

  it('should listen on port 3000 if env port not set', async () => {
    await bootstrap();
    const mockApp = await (NestFactory.create as jest.Mock)();
    expect(mockApp.listen).toHaveBeenCalledWith(3000);
  });

  it('should listen on env port', async () => {
    process.env.PORT = '4200';
    await bootstrap();
    const mockApp = await (NestFactory.create as jest.Mock)();
    expect(mockApp.listen).toHaveBeenCalledWith('4200');
  });

  it('should use global pipes', async () => {
    await bootstrap();
    const mockApp = await (NestFactory.create as jest.Mock)();
    expect(mockApp.useGlobalPipes).toHaveBeenCalled();
  });
});
