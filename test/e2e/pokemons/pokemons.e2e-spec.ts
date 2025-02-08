import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../../src/app.module';

describe('Pokemons (e2e)', () => {
  let app: INestApplication<App>;

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
    const response = await request(app.getHttpServer()).post('/pokemons');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const messageArray = response.body.message ?? [];

    expect(response.statusCode).toBe(400);

    expect(messageArray).toContain('name must be a string');
    expect(messageArray).toContain('name should not be empty');
    expect(messageArray).toContain('type must be a string');
    expect(messageArray).toContain('type should not be empty');

    // return request(app.getHttpServer())
    //   .post('/pokemons')
    //   .expect(200)
    //   .expect('Hello World!!');
  });

  it('/pokemons (POST) - with no body 2', async () => {
    const response = await request(app.getHttpServer()).post('/pokemons');

    const mostHaveErrorMessage = [
      'type should not be empty',
      'name must be a string',
      'type must be a string',
      'name should not be empty',
    ];

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const messageArray: string[] = response.body.message ?? [];

    expect(mostHaveErrorMessage.length).toBe(messageArray.length);
    expect(messageArray).toEqual(expect.arrayContaining(mostHaveErrorMessage));
  });

  it('/pokemons (POST) - with valid body', async () => {
    const response = await request(app.getHttpServer()).post('/pokemons').send({
      name: 'Pikachu',
      type: 'Electric',
    });

    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual({
      name: 'Pikachu',
      type: 'Electric',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      id: expect.any(Number),
      hp: 0,
      sprites: [],
    });
  });
});
