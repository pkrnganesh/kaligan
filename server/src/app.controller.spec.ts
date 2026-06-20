import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './app.module';
import { WsAdapter } from '@nestjs/platform-ws';

jest.mock('fastembed', () => {
  return {
    FlagEmbedding: {
      init: jest.fn().mockResolvedValue({
        embed: jest.fn().mockImplementation((texts: string[]) => {
          const dummyBatch = texts.map(() => Array(384).fill(0.25));
          return (async function* () {
            yield dummyBatch;
          })();
        }),
        queryEmbed: jest.fn().mockResolvedValue(Array(384).fill(0.25)),
      }),
    },
    EmbeddingModel: {
      BGESmallENV15: 'bge-small-en-v1.5',
    },
  };
}, { virtual: true });

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useWebSocketAdapter(new WsAdapter(app));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1 - should return Hello World!', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1')
      .expect(200);
    expect(res.text).toBe('Hello World!');
  });

  describe('POST /api/v1/public/contact', () => {
    it('should submit successfully with valid data', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/public/contact')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          websiteUrl: 'https://example.com',
          message: 'Hello, this is a test message.',
        })
        .expect(200);

      expect(res.body).toEqual({
        success: true,
        message: 'Message logged successfully',
      });
    });

    it('should throw bad request on missing fields', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/public/contact')
        .send({
          name: 'Jane Doe',
        })
        .expect(400);
    });

    it('should throw bad request on malformed email', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/public/contact')
        .send({
          name: 'Jane Doe',
          email: 'not-an-email',
          message: 'Hello',
        })
        .expect(400);
    });
  });

  describe('PublicRateLimiterGuard', () => {
    it('should throttle after 60 requests in the same minute window', async () => {
      let status = 200;
      let requestsSent = 0;

      while (status === 200 && requestsSent < 70) {
        const res = await request(app.getHttpServer())
          .post('/api/v1/public/contact')
          .send({
            name: 'Jane Doe',
            email: `jane-${requestsSent}@example.com`,
            message: 'Hello',
          });
        
        status = res.status;
        if (status === 200) {
          requestsSent++;
        } else if (status === 429) {
          expect(res.body.error).toBe('Too Many Requests');
        }
      }

      expect(status).toBe(429);
    });
  });
});
