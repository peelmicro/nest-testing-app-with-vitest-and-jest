/**
 * Application-specific e2e test utilities
 * These utilities build on the framework-agnostic utilities from test-utils.ts
 * but add Pokemon-specific functionality
 */
import {
  isVitest,
  createCustomTestRequest,
  MockRequest,
  MockResponse,
} from './test-utils';
import { mockPokemonData } from './mock-data';

/**
 * Pokemon-specific response handler function
 */
export function getPokemonMockResponse(
  req: MockRequest,
  statusOverride?: number,
): MockResponse {
  const { path, method, data, params } = req;
  const status = statusOverride || 200;

  // Pokemon API mocks
  if (path.startsWith('/pokemons')) {
    // POST to /pokemons
    if (method === 'post' && path === '/pokemons') {
      if (!data || Object.keys(data).length === 0) {
        return {
          statusCode: 400,
          status: 400,
          body: { message: mockPokemonData.validationErrors },
        };
      }
      return { statusCode: 201, status: 201, body: mockPokemonData.created };
    }

    // GET to /pokemons (list)
    if (method === 'get' && path === '/pokemons') {
      const limit = params?.limit || 10;
      return {
        status: 200,
        statusCode: 200,
        body: mockPokemonData.list(limit),
      };
    }

    // GET to /pokemons/:id
    if (method === 'get' && path.match(/^\/pokemons\/\d+$/)) {
      const id = parseInt(path.split('/').pop() || '0', 10);
      if (id === 1) {
        return {
          status: 200,
          statusCode: 200,
          body: mockPokemonData.bulbasaur,
        };
      } else if (id === 4) {
        return {
          status: 200,
          statusCode: 200,
          body: mockPokemonData.charmander,
        };
      } else if (id === 400001 || id === 4000000 || id === 1000000) {
        return {
          status: 404,
          statusCode: 404,
          body: mockPokemonData.notFound(id),
        };
      }

      return {
        status: 200,
        statusCode: 200,
        body: {
          id,
          name: `pokemon-${id}`,
          type: 'normal',
          hp: 50,
          sprites: [],
        },
      };
    }

    // PATCH to /pokemons/:id
    if (method === 'patch' && path.match(/^\/pokemons\/\d+$/)) {
      const id = parseInt(path.split('/').pop() || '0', 10);
      if (id === 4000000 || id === 1000000) {
        return {
          status: 404,
          statusCode: 404,
          body: mockPokemonData.notFound(id),
        };
      }

      const base =
        id === 1
          ? { ...mockPokemonData.bulbasaur }
          : id === 4
            ? { ...mockPokemonData.charmander }
            : {
                id,
                name: `pokemon-${id}`,
                type: 'normal',
                hp: 50,
                sprites: [],
              };

      return { status: 200, statusCode: 200, body: { ...base, ...data } };
    }

    // DELETE to /pokemons/:id
    if (method === 'delete' && path.match(/^\/pokemons\/\d+$/)) {
      const id = parseInt(path.split('/').pop() || '0', 10);

      if (id === 1000000 || id === 4000000) {
        return {
          status: 404,
          statusCode: 404,
          body: mockPokemonData.notFound(id),
        };
      }

      const name =
        id === 1 ? 'bulbasaur' : id === 4 ? 'charmander' : `pokemon-${id}`;

      return {
        status: 200,
        statusCode: 200,
        body: {},
        text: `Pokemon ${name} removed!`,
      };
    }
  }

  // Default to generic responses for non-Pokemon endpoints
  if (path === '/') {
    return { status: 200, statusCode: 200, body: {}, text: 'Hello World!' };
  }

  // Generic response
  return {
    status,
    statusCode: status,
    body: {},
    text: `Mock response for ${path}`,
  };
}

/**
 * Create a Pokemon-specific test request object that works with both Jest and Vitest
 */
export const pokemonTestRequest = createCustomTestRequest(
  getPokemonMockResponse,
);
