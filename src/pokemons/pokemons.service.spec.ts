import { Test, TestingModule } from '@nestjs/testing';
import { PokemonsService } from './pokemons.service';
import { NotFoundException } from '@nestjs/common';

describe('PokemonsService', () => {
  let service: PokemonsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PokemonsService],
    }).compile();

    service = module.get<PokemonsService>(PokemonsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a pokemon', async () => {
    const data = { name: 'Pikachu', type: 'Electric' };

    const result = await service.create(data);

    expect(result).toBe(`This action adds a ${data.name}`);
  });

  it('should return pokemon if exists', async () => {
    const id = 4;

    const result = await service.findOne(id);

    expect(result).toEqual({
      id: 4,
      name: 'charmander',
      type: 'fire',
      hp: 39,
      sprites: [
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png',
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/4.png',
      ],
    });
  });

  it("should return 404 error if pokemon doesn't exits", async () => {
    const id = 400_000;

    await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
    await expect(service.findOne(id)).rejects.toThrow(
      `Pokemon with id ${id} not found`,
    );
  });

  it('should check properties of the pokemon', async () => {
    const id = 4;
    const pokemon = await service.findOne(id);

    expect(pokemon).toHaveProperty('id');
    expect(pokemon).toHaveProperty('name');

    expect(pokemon).toEqual(
      expect.objectContaining({
        id: id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        hp: expect.any(Number),
      }),
    );
  });

  it('should find all pokemons and cache them', async () => {
    const pokemons = await service.findAll({ limit: 10, page: 1 });

    expect(pokemons).toBeInstanceOf(Array);
    expect(pokemons.length).toBe(10);

    expect(service.paginatedPokemonsCache.has('10-1')).toBeTruthy();
    expect(service.paginatedPokemonsCache.get('10-1')).toBe(pokemons);
  });
});
