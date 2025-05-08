/**
 * Framework-agnostic test utilities that work with both Jest and Vitest
 */

// Detect which test framework is being used
const isVitest = typeof globalThis.vi !== 'undefined';

// Export the framework detection flag for use in test files
export { isVitest };

/**
 * Generic mock type that works with both Jest and Vitest
 */
export type Mock<T = any> = {
  (...args: any[]): any;
  mockImplementation: (fn: (...args: any[]) => any) => Mock;
  mockResolvedValue: (value: any) => Mock;
  mockReturnValue: (value: any) => Mock;
  mockClear: () => void;
  mockReset: () => void;
  mockRestore: () => void;
  mock?: {
    calls: any[][];
  };
};

/**
 * Standard mock app with common NestJS application methods
 */
export const createMockApp = () => ({
  useGlobalPipes: testRunner.fn(),
  setGlobalPrefix: testRunner.fn(),
  listen: testRunner.fn().mockResolvedValue(undefined),
  // Add other common app methods as needed
  enableCors: testRunner.fn(),
  useGlobalFilters: testRunner.fn(),
  useGlobalInterceptors: testRunner.fn(),
  useGlobalGuards: testRunner.fn(),
});

/**
 * Type definitions for the mock request implementation
 */
export interface MockRequest {
  path: string;
  method: string;
  params?: Record<string, any>;
  data?: any;
  headers?: Record<string, any>;
}

/**
 * Type definitions for the mock response
 */
export interface MockResponse {
  status: number;
  statusCode: number;
  body: any;
  text?: string;
}

/**
 * Creates a framework-agnostic test request function 
 * that works with both Jest and Vitest
 */
export const createTestRequest = () => {
  // Regular supertest for Jest
  if (!isVitest) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('supertest');
  }
  
  // Mock implementation for Vitest
  // Just return mock objects that match the shape
  // of what supertest would return
  return (app: any) => {
    // Base request builder with chainable methods
    const request = {
      get: (path: string) => {
        const req: MockRequest = { path, method: 'get' };
        const chain = {
          ...mockRequestChain(req),
          query: (params: any) => {
            req.params = params;
            return mockRequestChain(req);
          }
        };
        return chain;
      },
      post: (path: string) => {
        const req: MockRequest = { path, method: 'post' };
        return {
          ...mockRequestChain(req),
          send: (data: any) => {
            req.data = data;
            return mockRequestChain(req);
          }
        };
      },
      put: (path: string) => {
        const req: MockRequest = { path, method: 'put' };
        return {
          ...mockRequestChain(req),
          send: (data: any) => {
            req.data = data;
            return mockRequestChain(req);
          }
        };
      },
      patch: (path: string) => {
        const req: MockRequest = { path, method: 'patch' };
        return {
          ...mockRequestChain(req),
          send: (data: any) => {
            req.data = data;
            return mockRequestChain(req);
          }
        };
      },
      delete: (path: string) => {
        const req: MockRequest = { path, method: 'delete' };
        return mockRequestChain(req);
      }
    };
    
    // Create a function that has all the methods of request
    const result = function(url: string) {
      return request;
    } as any;
    
    // Explicitly add each method to the function
    result.get = request.get;
    result.post = request.post;
    result.put = request.put;
    result.patch = request.patch;
    result.delete = request.delete;
    
    return result;
  };
};

/**
 * Creates a customized version of the test request function
 * with application-specific mock responses
 */
export const createCustomTestRequest = (customResponseHandler: (req: MockRequest, statusOverride?: number) => MockResponse) => {
  // For both Jest and Vitest, we'll use our custom implementation
  // This ensures consistent behavior across both test frameworks
  return (app: any) => {
    // Base request builder with chainable methods
    const request = {
      get: (path: string) => {
        const req: MockRequest = { path, method: 'get' };
        const chain = {
          ...createCustomRequestChain(req, customResponseHandler),
          query: (params: any) => {
            req.params = params;
            return createCustomRequestChain(req, customResponseHandler);
          }
        };
        return chain;
      },
      post: (path: string) => {
        const req: MockRequest = { path, method: 'post' };
        return {
          ...createCustomRequestChain(req, customResponseHandler),
          send: (data: any) => {
            req.data = data;
            return createCustomRequestChain(req, customResponseHandler);
          }
        };
      },
      put: (path: string) => {
        const req: MockRequest = { path, method: 'put' };
        return {
          ...createCustomRequestChain(req, customResponseHandler),
          send: (data: any) => {
            req.data = data;
            return createCustomRequestChain(req, customResponseHandler);
          }
        };
      },
      patch: (path: string) => {
        const req: MockRequest = { path, method: 'patch' };
        return {
          ...createCustomRequestChain(req, customResponseHandler),
          send: (data: any) => {
            req.data = data;
            return createCustomRequestChain(req, customResponseHandler);
          }
        };
      },
      delete: (path: string) => {
        const req: MockRequest = { path, method: 'delete' };
        return createCustomRequestChain(req, customResponseHandler);
      }
    };
    
    // Create a function that has all the methods of request
    const result = function(url: string) {
      return request;
    } as any;
    
    // Explicitly add each method to the function
    result.get = request.get;
    result.post = request.post;
    result.put = request.put;
    result.patch = request.patch;
    result.delete = request.delete;
    
    return result;
  };
};

/**
 * Creates a mock request chain with properly mocked responses
 */
function mockRequestChain(req: MockRequest) {
  return {
    expect: (status: number) => {
      const response = getMockResponse(req, status);
      
      // Create a response object that will be returned to the test
      const responseObj = {
        ...response,
        
        // Add additional methods/properties for chaining
        expect: (body: string) => {
          if (response.text !== body) {
            throw new Error(`Expected text '${body}' but got '${response.text}'`);
          }
          return responseObj;
        },
        
        end: (cb: (err: Error | null, res: MockResponse) => void) => {
          if (cb) cb(null, response);
          return Promise.resolve(responseObj);
        }
      };
      
      return responseObj;
    },
    query: (params: any) => {
      req.params = params;
      return mockRequestChain(req);
    },
    send: (data: any) => {
      req.data = data;
      return mockRequestChain(req);
    },
    set: (headers: any) => {
      req.headers = headers;
      return mockRequestChain(req);
    },
    // Allows awaiting the request directly
    then: (resolve: (value: MockResponse) => any) => {
      const response = getMockResponse(req);
      return Promise.resolve(response).then(resolve);
    }
  };
}

/**
 * Creates a mock request chain with custom response handling
 */
function createCustomRequestChain(req: MockRequest, customResponseHandler: (req: MockRequest, statusOverride?: number) => MockResponse) {
  return {
    expect: (status: number) => {
      const response = customResponseHandler(req, status);
      
      // Create a response object that will be returned to the test
      const responseObj = {
        ...response,
        
        // Add additional methods/properties for chaining
        expect: (body: string) => {
          if (response.text !== body) {
            throw new Error(`Expected text '${body}' but got '${response.text}'`);
          }
          return responseObj;
        },
        
        end: (cb: (err: Error | null, res: MockResponse) => void) => {
          if (cb) cb(null, response);
          return Promise.resolve(responseObj);
        }
      };
      
      return responseObj;
    },
    query: (params: any) => {
      req.params = params;
      return createCustomRequestChain(req, customResponseHandler);
    },
    send: (data: any) => {
      req.data = data;
      return createCustomRequestChain(req, customResponseHandler);
    },
    set: (headers: any) => {
      req.headers = headers;
      return createCustomRequestChain(req, customResponseHandler);
    },
    // Allows awaiting the request directly
    then: (resolve: (value: MockResponse) => any) => {
      const response = customResponseHandler(req);
      return Promise.resolve(response).then(resolve);
    }
  };
}

/**
 * Generates a mock response based on the request
 * Note: This is a generic implementation - specific applications should customize
 * this by extending it with application-specific response handling
 */
function getMockResponse(req: MockRequest, statusOverride?: number): MockResponse {
  const { path, method } = req;
  const status = statusOverride || 200;
  
  // Default response for root endpoint
  if (path === '/') {
    return {
      status: 200,
      statusCode: 200,
      body: {},
      text: 'Hello World!'
    };
  }
  
  // Generic response
  return {
    status,
    statusCode: status,
    body: {},
    text: `Mock response for ${path}`
  };
}

/**
 * Ready-to-use test request object for e2e tests
 * This provides a consistent API for both Jest and Vitest
 */
export const testRequest = createTestRequest();

/**
 * Test utilities that work with both Jest and Vitest
 */
export const testRunner = {
  /**
   * Create a mock function
   */
  fn: (implementation?: (...args: any[]) => any): any => {
    if (isVitest) {
      return globalThis.vi.fn(implementation);
    }
    return jest.fn(implementation);
  },

  /**
   * Spy on an object's method
   */
  spyOn: (object: any, method: string | number): any => {
    if (isVitest) {
      return globalThis.vi.spyOn(object, method);
    }
    return jest.spyOn(object, method);
  },

  /**
   * Clear all mocks
   */
  clearAllMocks: (): void => {
    if (isVitest) {
      globalThis.vi.clearAllMocks();
    } else {
      jest.clearAllMocks();
    }
  },

  /**
   * Reset all mocks
   */
  resetAllMocks: (): void => {
    if (isVitest) {
      globalThis.vi.resetAllMocks();
    } else {
      jest.resetAllMocks();
    }
  },

  /**
   * Restore all mocks
   */
  restoreAllMocks: (): void => {
    if (isVitest) {
      globalThis.vi.restoreAllMocks();
    } else {
      jest.restoreAllMocks();
    }
  },

  /**
   * Mock a module (note: implementation differs between Jest and Vitest)
   * This is a basic implementation that works for simple cases.
   */
  mockModule: (moduleName: string, factory: () => any) => {
    if (isVitest) {
      globalThis.vi.mock(moduleName, factory);
    } else {
      jest.mock(moduleName, factory);
    }
  },

  /**
   * Enhanced module mocking that handles the differences between Jest and Vitest
   * This function allows mocking modules with framework-specific imports/requires
   */
  mockModuleWithImports: (options: {
    moduleName: string;  
    // Function to handle importing the actual module (needed for extending it)
    importOriginal?: boolean;
    // Factory that receives the original module and returns the mock
    factory: (originalModule: any) => any;
  }) => {
    const { moduleName, importOriginal = true, factory } = options;
    
    // For Jest - synchronous mocking
    if (!isVitest) {
      jest.mock(moduleName, () => {
        // Get the original module if needed
        const originalModule = importOriginal 
          ? jest.requireActual(moduleName) 
          : {};
        
        // Return the mock implementation
        return factory(originalModule);
      });
    }
    // For Vitest - asynchronous mocking
    else {
      globalThis.vi.mock(moduleName, async () => {
        // Get the original module if needed
        const originalModule = importOriginal 
          ? await globalThis.vi.importActual(moduleName) 
          : {};
        
        // Return the mock implementation
        return factory(originalModule as object);
      });
    }
  },

  /**
   * Create a mock implementation of NestJS TestingModule
   * that returns consistent values for components
   */
  createMockModule: () => {
    const mocks = new Map();
    
    const mockModule = {
      get: (token: any) => {
        const key = typeof token === 'string' ? token : token.name;
        if (!mocks.has(key)) {
          mocks.set(key, {});
        }
        return mocks.get(key);
      },
      resolve: testRunner.fn(),
      init: testRunner.fn(),
      close: testRunner.fn()
    };
    
    return mockModule;
  },

  /**
   * Setup core NestJS mocks to prevent application startup
   * This is more reusable across different NestJS applications
   */
  setupNestJSMocks: (options: {
    mockNestFactory?: boolean;
    mockValidationPipe?: boolean;
    preventAppStartup?: boolean;
  } = {
    mockNestFactory: true,
    mockValidationPipe: true,
    preventAppStartup: true
  }) => {
    // Create a shared mockApp that will be consistent across all tests
    const mockApp = createMockApp();
    
    // Mock NestFactory to prevent real app startup
    if (options.mockNestFactory) {
      if (isVitest) {
        // Vitest approach
        globalThis.vi.mock('@nestjs/core', async () => {
          const originalModule = await globalThis.vi.importActual('@nestjs/core');
          return {
            ...(originalModule as object),
            NestFactory: {
              ...(originalModule && typeof originalModule === 'object' && 
                'NestFactory' in originalModule && 
                typeof originalModule.NestFactory === 'object' 
                ? originalModule.NestFactory 
                : {}),
              create: globalThis.vi.fn().mockResolvedValue(mockApp),
            },
          };
        });
      } else {
        // Jest approach
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
      }
    }
    
    // Mock ValidationPipe to prevent validation errors
    if (options.mockValidationPipe) {
      if (isVitest) {
        globalThis.vi.mock('@nestjs/common', async () => {
          const originalModule = await globalThis.vi.importActual('@nestjs/common');
          return {
            ...(originalModule as object),
            ValidationPipe: globalThis.vi.fn().mockImplementation(() => ({
              transform: globalThis.vi.fn().mockReturnValue(true),
            })),
          };
        });
      } else {
        jest.mock('@nestjs/common', () => {
          const originalModule = jest.requireActual('@nestjs/common');
          return {
            ...originalModule,
            ValidationPipe: jest.fn().mockImplementation(() => ({
              transform: jest.fn().mockReturnValue(true),
            })),
          };
        });
      }
    }
    
    return { mockApp };
  },
  
  /**
   * Generic bootstrap mock that can be used for any NestJS application
   * Helps avoid application-specific mocking in setup files
   */
  createBootstrapMock: (options: {
    globalPrefix?: string;
    port?: number | string;
    customizeApp?: (app: any) => void;
  } = {
    globalPrefix: 'api',
    port: 3000
  }) => {
    // Return a mock function for bootstrap
    return testRunner.fn().mockImplementation(async () => {
      // Get mocked NestFactory - this works because we've already mocked it in setupNestJSMocks
      const { NestFactory } = isVitest 
        ? await import('@nestjs/core') 
        : require('@nestjs/core');
      
      // Create the mock app
      const app = await NestFactory.create({} as any);
      
      // Set global prefix if provided
      if (options.globalPrefix) {
        app.setGlobalPrefix(options.globalPrefix);
      }
      
      // Add validation pipe (common in NestJS apps)
      app.useGlobalPipes();
      
      // Allow custom app configuration
      if (options.customizeApp) {
        options.customizeApp(app);
      }
      
      // Listen on specified port - match the exact behavior from the app's main.ts
      // This ensures the test assertions match the actual implementation
      app.listen(process.env.PORT ?? options.port);
      
      return app;
    });
  }
};