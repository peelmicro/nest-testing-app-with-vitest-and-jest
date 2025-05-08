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

1. Copy the setup files and test-utils.ts as-is (they're fully framework-agnostic)
2. In your test files, add application-specific mocking with framework detection:
   ```typescript
   // In your test file
   if (typeof jest !== 'undefined') {
     jest.mock('./your-module', () => { /* Jest-specific mocking */ });
   } else {
     vi.mock('./your-module', async () => { /* Vitest-specific mocking */ });
   }
   ```
3. Use the `testRunner` utilities in your tests for creating mocks and spies

This approach ensures maximum reusability of the testing infrastructure while keeping tests self-contained and clear.

## Why Different Mocking Approaches for Jest and Vitest

Despite our efforts to create a fully unified testing approach, we still need to use different mocking code for Jest and Vitest in test files. This is due to fundamental technical differences between the two frameworks:

1. **Module Hoisting**: Jest automatically hoists mock declarations to the top of the file before any imports are processed. Vitest, however, follows the standard ESM execution order, meaning mocks must be defined before they're used.

2. **Synchronous vs Asynchronous APIs**:
   - Jest's module mocking is synchronous: `jest.mock('./path', () => {...})`
   - Vitest's module mocking is asynchronous: `vi.mock('./path', async () => {...})`

3. **Module Importing**:
   - Jest uses synchronous `requireActual` to get the original module
   - Vitest uses asynchronous `importActual` to get the original module

4. **ESM vs CommonJS**: Jest was originally designed for CommonJS modules, while Vitest was built from the ground up for ESM compatibility.

These fundamental differences prevent us from creating a single, unified mocking function that works perfectly for both frameworks. Our solution uses the hybrid approach of framework detection with shared implementation logic.

## Limitations and Future Improvements

This solution represents a practical approach to supporting both Jest and Vitest in a NestJS application, but it's not perfect and could be improved:

1. **Mock Module Limitations**: Our framework-agnostic mock module utility works for simple cases but can't fully abstract away all the differences between Jest and Vitest mocking systems.

2. **Test File Complexity**: Test files still need conditional code for framework detection, which adds complexity.

3. **Type Safety**: Some areas use type assertions (`as any`) to satisfy TypeScript when dealing with cross-framework types.

4. **Module Resolution**: Path resolution can be tricky when mocking modules across different frameworks.

Potential improvements could include:

- Developing more sophisticated mocking utilities that better abstract framework differences
- Creating a custom Babel/TypeScript transformer to handle framework-specific code at compile time
- Exploring ways to make the test files even more framework-agnostic

Despite these limitations, the current approach provides a workable solution that allows teams to use either Jest or Vitest without maintaining separate test codebases.

## License

This project is [MIT licensed](LICENSE).
