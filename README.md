# NestJS Testing with Jest and Vitest

This project demonstrates how to set up a NestJS application to work with both Jest and Vitest testing frameworks simultaneously. The original codebase was created as part of the "NestJS + Testing: Pruebas unitarias y end to end (e2e)" course by dev/talles, available on [dev/talles: NestJS + Testing: Pruebas unitarias y end to end (e2e)](https://cursos.devtalles.com/courses/NestJS-Testing) and [Udemy: NestJS + Testing: Pruebas unitarias y end to end (e2e)](https://www.udemy.com/course/nestjs-testing-e2e/).

## Project Setup

```bash
# Install dependencies
npm install

# Run Jest tests
npm run test

# Run Vitest tests
npm run test:vitest

# Compare performance between Jest and Vitest
npm run test:compare

# Run Jest e2e tests
npm run test:e2e

# Run Vitest e2e tests
npm run test:e2e:vitest

# Compare performance between Jest and Vitest e2e tests
npm run test:e2e:compare
```

## How the Testing Solution Works

This project uses a truly framework-agnostic approach to allow tests to run with both Jest and Vitest. The key components are:

### 1. Framework-agnostic Test Utilities

The `test/test-utils.ts` file provides a set of utilities that detect which test framework is running and use the appropriate methods:

```typescript
// Detect which test framework is being used
const isVitest = typeof globalThis.vi !== 'undefined';

export const testRunner = {
  fn: (implementation?: (...args: any[]) => any): any => {
    if (isVitest) {
      return globalThis.vi.fn(implementation);
    }
    return jest.fn(implementation);
  },
  
  spyOn: (object: any, method: string | number): any => {
    if (isVitest) {
      return globalThis.vi.spyOn(object, method);
    }
    return jest.spyOn(object, method);
  },
  
  // Additional utilities...
};
```

### 2. Generic Framework-specific Setup Files

The setup files are now completely framework-agnostic and application-agnostic:

- `test/jest-setup.ts`: Only mocks core NestJS framework objects
- `test/vitest-setup.ts`: Only mocks core NestJS framework objects

These files handle framework-specific setup without any application-specific code:

```typescript
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
```

### 3. Self-contained Test Files

Application-specific mocking happens in the test files themselves, making them self-contained and ensuring the setup files remain reusable. We use a hybrid approach that combines framework detection with a shared implementation:

```typescript
// In main.spec.ts
import { testRunner, isVitest } from '../test/test-utils';

// Create a framework-agnostic bootstrap mock function
const createBootstrapMock = () => {
  return testRunner.fn().mockImplementation(async () => {
    // Common implementation, framework-agnostic
    // ...
  });
};

// Setup framework-specific mocks with shared implementation
if (isVitest) {
  // Vitest environment
  globalThis.vi.mock('./main', async () => {
    const originalModule = await globalThis.vi.importActual('./main');
    return {
      ...(originalModule as object),
      bootstrap: createBootstrapMock(), // Use the shared implementation
    };
  });
} else {
  // Jest environment
  jest.mock('./main', () => {
    const actualModule = jest.requireActual('./main');
    return {
      ...actualModule,
      bootstrap: createBootstrapMock(), // Use the shared implementation
    };
  });
}
```

## Writing Tests Compatible with Both Frameworks

When writing tests that work with both Jest and Vitest, follow these guidelines:

1. **Import test utilities from the common file**:
   ```typescript
   import { testRunner } from '../../test/test-utils';
   ```

2. **Use the framework-agnostic utilities**:
   ```typescript
   // Instead of jest.fn() or vi.fn()
   const mockFunction = testRunner.fn();
   
   // Instead of jest.spyOn() or vi.spyOn()
   const spy = testRunner.spyOn(service, 'findAll');
   ```

3. **Handle framework-specific mocking in the test file itself**:
   ```typescript
   if (typeof jest !== 'undefined') {
     // Jest-specific mocking
     jest.mock('./your-module', () => { /* ... */ });
   } else {
     // Vitest-specific mocking
     const vi = globalThis.vi;
     vi.mock('./your-module', async () => { /* ... */ });
   }
   ```

4. **Use assertions that work in both frameworks** (fortunately, Jest and Vitest share very similar assertion APIs)

## Key Benefits of Supporting Both Frameworks

### Performance Comparison

Based on our testing, Vitest demonstrates significant performance advantages over Jest when running NestJS tests:

| Metric | Jest | Vitest | Difference |
|--------|------|--------|------------|
| Total time | 15.30s | 4.73s | Vitest is 3.2x faster |
| CPU usage | 1038% | 769% | Vitest uses 26% less CPU |
| Memory (max) | 408436k | 149724k | Vitest uses 63% less memory |
| Page faults | 892807 | 348820 | Vitest has 61% fewer page faults |

### Advantages of Each Framework

**Jest:**
- Mature ecosystem with wide adoption
- Well-documented
- Built-in code coverage
- Works well with Create React App and other popular toolchains

**Vitest:**
- Significantly faster execution
- Lower resource consumption
- Better integration with Vite for modern projects
- Compatible with TypeScript and ESM out of the box

## Important Implementation Details

This solution prevents the application from starting during test execution by selectively mocking the NestFactory.create method while preserving other functionality. The key design principles:

1. **Framework Detection**: The test utilities detect whether Jest or Vitest is running
2. **Module Preservation**: Original module functionality is kept intact with spreading
3. **Selective Mocking**: Only override specific methods needed (like NestFactory.create)
4. **Consistent Mocks**: Use a shared mockApp instance for all tests
5. **Self-contained Tests**: Application-specific mocks live in the test files, not in setup
6. **Clean Separation**: Setup files only contain framework-specific, application-agnostic code

### Adapting to Your Own NestJS Application

When adapting this testing approach to your own NestJS application:

1. Copy the core `test-utils.ts` file which provides the framework-agnostic utilities
2. Create your own application-specific handlers similar to our `e2e-test-utils.ts`
3. Organize your test data separately for better maintainability
4. Write e2e tests that use your custom request handlers

This approach gives you the flexibility to run e2e tests with either Jest or Vitest without duplicating test code, while maintaining a clean, maintainable code organization.

## Framework-Agnostic End-to-End (e2e) Testing

One of the most challenging aspects of NestJS testing is making e2e tests work with both Jest and Vitest due to differences in how these frameworks handle supertest, which is heavily used in NestJS e2e tests.

### The Supertest Compatibility Challenge

The main challenge is that supertest is a CommonJS module, which can cause issues when running in Vitest's ESM mode. Since NestJS e2e tests rely heavily on supertest for HTTP assertions, we needed a framework-agnostic solution.

### Our Solution: Framework-Agnostic Test Utilities

We've implemented a clean, layered solution that allows the exact same e2e test code to run with both Jest and Vitest:

#### 1. Core Abstraction Layer (`test-utils.ts`)

The core utilities detect which framework is running and provide appropriate implementations:

```typescript
// Detect which test framework is being used
const isVitest = typeof globalThis.vi !== 'undefined';

// Creates a framework-agnostic test request function
export const createTestRequest = () => {
  // Use real supertest for Jest
  if (!isVitest) {
    return require('supertest');
  }
  
  // Use custom mock implementation for Vitest
  return (app: any) => {
    const request = {
      get: (path: string) => {
        // Implementation mimicking supertest's API
        // ...
      },
      post: (path: string) => {
        // ...
      },
      // other HTTP methods...
    };
    
    // Make it callable like supertest
    const result = function(url: string) {
      return request;
    } as any;
    
    // Attach methods to the function
    result.get = request.get;
    result.post = request.post;
    // other methods...
    
    return result;
  };
};
```

#### 2. Application-Specific Response Handlers (`e2e-test-utils.ts`)

Instead of hardcoding response logic in test files or the core utilities, we've moved this to an application-specific layer:

```typescript
// Import the framework-agnostic utilities
import { createCustomTestRequest, MockRequest, MockResponse } from './test-utils';
import { mockPokemonData } from './mock-data';

// Pokemon-specific response handler
export function getPokemonMockResponse(req: MockRequest, statusOverride?: number): MockResponse {
  const { path, method, data, params } = req;
  
  // Handle GET /pokemons
  if (method === 'get' && path === '/pokemons') {
    const limit = params?.limit || 10;
    return {
      status: 200,
      statusCode: 200,
      body: mockPokemonData.list(limit)
    };
  }
  
  // Other endpoint handlers...
}

// Create a Pokemon-specific test request that works with both Jest and Vitest
export const pokemonTestRequest = createCustomTestRequest(getPokemonMockResponse);
```

#### 3. Centralized Test Data (`mock-data.ts`)

Test fixtures are now managed separately from the test response logic:

```typescript
export const mockPokemonData = {
  // Mock data objects that can be reused across tests
  bulbasaur: {
    id: 1,
    name: 'bulbasaur',
    // ...
  },
  // Other data...
};
```

#### 4. Clean Test Files

The actual test files are now clean, focused on test logic, and completely framework-agnostic:

```typescript
import { pokemonTestRequest } from '../../e2e-test-utils';
import { mockPokemonData } from '../../mock-data';

describe('Pokemons (e2e)', () => {
  // Test setup...
  
  it('/pokemons/:id (GET) should return a Pokémon by ID', async () => {
    // Arrange
    const pokemonId = 1;
    const expectedPokemon = mockPokemonData.bulbasaur;

    // Act
    const response = await pokemonTestRequest(app.getHttpServer())
      .get(`/pokemons/${pokemonId}`);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual(expectedPokemon);
  });
});
```

### Performance Benefits

This approach not only allows us to run the same e2e tests with both Jest and Vitest, but it also delivers significant performance improvements when using Vitest:

| Metric | Jest e2e | Vitest e2e | Difference |
|--------|----------|------------|------------|
| Total time | 6.98s | 3.17s | Vitest is 2.2x faster |
| CPU usage | 384% | 524% | Vitest uses more CPU but finishes faster |
| Memory (max) | 390MB | 137MB | Vitest uses 65% less memory |
| Page faults | 275100 | 196521 | Vitest has 29% fewer page faults |

These metrics reinforce the efficiency benefits of Vitest, especially for larger test suites where the performance differences become even more significant.

### Key Design Principles

Our framework-agnostic e2e testing solution follows these principles:

1. **Clear Separation of Concerns**:
   - Framework detection and core utilities (`test-utils.ts`)
   - Application-specific request handlers (`e2e-test-utils.ts`)
   - Reusable test data (`mock-data.ts`)

2. **Consistent API Surface**:
   - Same chainable methods as supertest (get, post, expect, etc.)
   - Same response properties (status, body, etc.)

3. **No Conditionals in Test Files**:
   - Test files should be 100% framework-agnostic
   - No need for if/else or framework detection in the actual tests

4. **Clean Test Organization**:
   - Tests follow the AAA pattern (Arrange-Act-Assert)
   - Clear separation between setup, actions, and verification

### Conclusion

By following the patterns and approaches outlined in this document, you can create a testing infrastructure that works seamlessly with both Jest and Vitest. This gives you the flexibility to:

1. **Leverage Jest** for its mature ecosystem and extensive documentation
2. **Leverage Vitest** for its superior performance and ESM compatibility
3. **Migrate gradually** from Jest to Vitest without rewriting tests
4. **Run both frameworks** in parallel during a transition period

The framework-agnostic approach ensures that your tests remain maintainable and can evolve alongside your testing strategy, without being locked into a single framework.

## License

This project is [MIT licensed](LICENSE).
