/**
 * Application-specific mock data for tests
 * This file contains Pokemon-specific data and should be imported by tests that need it
 */

/**
 * Mock data for Pokemon API e2e tests
 */
export const mockPokemonData = {
  // Mock for validation errors
  validationErrors: [
    'name must be a string',
    'name should not be empty',
    'type must be a string',
    'type should not be empty',
  ],
  // Mock for successful creation
  created: {
    name: 'Pikachu',
    type: 'Electric',
    id: 999,
    hp: 0,
    sprites: [],
  },
  // Mock for specific pokemons
  bulbasaur: {
    id: 1,
    name: 'bulbasaur',
    type: 'grass',
    hp: 45,
    sprites: [
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/1.png',
    ],
  },
  charmander: {
    id: 4,
    name: 'charmander',
    type: 'fire',
    hp: 39,
    sprites: [
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png',
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/4.png',
    ],
  },
  // Not found error
  notFound: (id: number) => ({
    message: `Pokemon with id ${id} not found`,
    error: 'Not Found',
    statusCode: 404
  }),
  // Mock list of pokemons
  list: (limit = 10) => Array(limit).fill(null).map((_, idx) => ({
    id: idx + 1,
    name: `pokemon-${idx}`,
    type: 'normal',
    hp: 50,
    sprites: []
  }))
}; 