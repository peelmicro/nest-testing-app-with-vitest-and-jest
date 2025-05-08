import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { App } from 'supertest/types';
import { AppModule } from '../../../src/app.module';
import { Pokemon } from 'src/pokemons/entities/pokemon.entity';
import { pokemonTestRequest } from '../../e2e-test-utils';
import { mockPokemonData } from '../../mock-data';

describe('Pokemons (e2e)', () => {
  let app: INestApplication<App>;

  // Arrange - shared test setup
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // app.setGlobalPrefix('api')
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  it('/pokemons (POST) - with no body ', async () => {
    // Arrange - no additional setup needed, we're testing empty body
    const expectedErrors = mockPokemonData.validationErrors;

    // Act - perform the HTTP request
    const response = await pokemonTestRequest(app.getHttpServer())
      .post('/pokemons');
    
    // Assert - verify the response
    expect(response.status).toBe(400);
    expect(response.statusCode).toBe(400);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const messageArray = response.body.message ?? [];

    // Verify all expected validation errors are present
    expectedErrors.forEach(error => {
      expect(messageArray).toContain(error);
    });
  });

  it('/pokemons (POST) - with no body 2', async () => {
    // Arrange - define expected error messages
    const mostHaveErrorMessage = mockPokemonData.validationErrors;

    // Act
    const response = await pokemonTestRequest(app.getHttpServer())
      .post('/pokemons');

    // Assert
    expect(response.status).toBe(400);
    expect(response.statusCode).toBe(400);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const messageArray: string[] = response.body.message ?? [];

    expect(mostHaveErrorMessage.length).toBe(messageArray.length);
    expect(messageArray).toEqual(expect.arrayContaining(mostHaveErrorMessage));
  });

  it('/pokemons (POST) - with valid body', async () => {
    // Arrange - prepare valid Pokemon data
    const createPokemonDto = {
      name: 'Pikachu',
      type: 'Electric',
    };
    const expectedPokemon = mockPokemonData.created;

    // Act
    const response = await pokemonTestRequest(app.getHttpServer())
      .post('/pokemons')
      .send(createPokemonDto);

    // Assert
    expect(response.status).toBe(201);
    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual(expectedPokemon);
  });

  it('/pokemons (GET) should return paginated list of pokemons', async () => {
    // Arrange - set pagination parameters
    const limit = 5;
    const page = 1;

    // Act
    const response = await pokemonTestRequest(app.getHttpServer())
      .get('/pokemons')
      .query({ limit, page });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.length).toBe(limit);

    (response.body as Pokemon[]).forEach((pokemon) => {
      expect(pokemon).toHaveProperty('id');
      expect(pokemon).toHaveProperty('name');
      expect(pokemon).toHaveProperty('type');
      expect(pokemon).toHaveProperty('hp');
      expect(pokemon).toHaveProperty('sprites');
    });
  });

  it('/pokemons (GET) should return 20 paginated pokemons', async () => {
    // Arrange - set pagination for 20 results
    const limit = 20;
    const page = 1;

    // Act
    const response = await pokemonTestRequest(app.getHttpServer())
      .get('/pokemons')
      .query({ limit, page });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.length).toBe(limit);

    (response.body as Pokemon[]).forEach((pokemon) => {
      expect(pokemon).toHaveProperty('id');
      expect(pokemon).toHaveProperty('name');
      expect(pokemon).toHaveProperty('type');
      expect(pokemon).toHaveProperty('hp');
      expect(pokemon).toHaveProperty('sprites');
    });
  });

  it('/pokemons/:id (GET) should return a Pokémon by ID', async () => {
    // Arrange - specify the Pokemon ID to retrieve
    const pokemonId = 1;
    const expectedPokemon = mockPokemonData.bulbasaur;

    // Act
    const response = await pokemonTestRequest(app.getHttpServer())
      .get(`/pokemons/${pokemonId}`);

    // Assert
    expect(response.status).toBe(200);
    const pokemon = response.body as Pokemon;
    expect(pokemon).toEqual(expectedPokemon);
  });

  it('/pokemons/:id (GET) should return a Charmander', async () => {
    // Arrange - specify Charmander's ID and expected data
    const pokemonId = 4;
    const expectedPokemon = mockPokemonData.charmander;

    // Act
    const response = await pokemonTestRequest(app.getHttpServer())
      .get(`/pokemons/${pokemonId}`);

    // Assert
    expect(response.status).toBe(200);
    const pokemon = response.body as Pokemon;
    expect(pokemon).toEqual(expectedPokemon);
  });

  it('/pokemons/:id (GET) should return Not found', async () => {
    // Arrange - use an ID that doesn't exist
    const pokemonId = 400_001;
    const expectedError = mockPokemonData.notFound(pokemonId);
    
    // Act
    const response = await pokemonTestRequest(app.getHttpServer())
      .get(`/pokemons/${pokemonId}`);

    // Assert
    expect(response.status).toBe(404);
    expect(response.body).toEqual(expectedError);
  });

  it('/pokemons/:id (PATCH) should update pokemon', async () => {
    // Arrange - prepare for update operation
    const pokemonId = 1;
    const updateDto = { name: 'Pikachu', type: 'Electric' };
    
    // Act - first get the original pokemon
    const pokemonResponse = await pokemonTestRequest(app.getHttpServer())
      .get(`/pokemons/${pokemonId}`);
    
    expect(pokemonResponse.status).toBe(200);
    const bulbasaur = pokemonResponse.body as Pokemon;

    // Act - then update it
    const response = await pokemonTestRequest(app.getHttpServer())
      .patch(`/pokemons/${pokemonId}`)
      .send(updateDto);

    // Assert
    expect(response.status).toBe(200);
    const updatedPokemon = response.body as Pokemon;

    // Properties that should remain the same
    expect(bulbasaur.hp).toBe(updatedPokemon.hp);
    expect(bulbasaur.id).toBe(updatedPokemon.id);
    expect(bulbasaur.sprites).toEqual(updatedPokemon.sprites);

    // Properties that should be updated
    expect(updatedPokemon.name).toBe(updateDto.name);
    expect(updatedPokemon.type).toBe(updateDto.type);
  });

  it('/pokemons/:id (PATCH) should throw an 404', async () => {
    // Arrange - use a non-existent ID and empty update
    const nonExistentId = 4_000_000;
    const emptyUpdate = {};

    // Act
    const pokemonResponse = await pokemonTestRequest(app.getHttpServer())
      .patch(`/pokemons/${nonExistentId}`)
      .send(emptyUpdate);

    // Assert
    expect(pokemonResponse.status).toBe(404);
  });

  it('/pokemons/:id (DELETE) should delete pokemon', async () => {
    // Arrange - set up for deletion
    const pokemonId = 1;
    const expectedMessage = `Pokemon bulbasaur removed!`;

    // Act
    const pokemonResponse = await pokemonTestRequest(app.getHttpServer())
      .delete(`/pokemons/${pokemonId}`);

    // Assert
    expect(pokemonResponse.status).toBe(200);
    expect(pokemonResponse.text).toBe(expectedMessage);
  });

  it('/pokemons/:id (DELETE) should return 404', async () => {
    // Arrange - use a non-existent ID for deletion
    const nonExistentId = 1_000_000;

    // Act
    const pokemonResponse = await pokemonTestRequest(app.getHttpServer())
      .delete(`/pokemons/${nonExistentId}`);
      
    // Assert
    expect(pokemonResponse.status).toBe(404);
  });
});
