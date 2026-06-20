import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  // Configure dynamic CORS: Owner endpoints restricted to APP_ORIGIN, public endpoints open to all
  const corsOptionsDelegate = (
    req: any,
    callback: (err: Error | null, options?: CorsOptions) => void,
  ) => {
    const origin = req.header('Origin');
    const isPublicRoute = req.url && req.url.includes('/api/v1/public');
    let corsOptions: CorsOptions;

    if (isPublicRoute) {
      corsOptions = {
        origin: true, // Allow all origins for public routes
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      };
    } else {
      const appOrigin = process.env.APP_ORIGIN || 'http://localhost:3000';
      const allowedOrigins = [appOrigin];
      const isAllowed = !origin || allowedOrigins.includes(origin);

      corsOptions = {
        origin: isAllowed ? origin : false,
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      };
    }
    callback(null, corsOptions);
  };

  app.enableCors(corsOptionsDelegate);
  app.useWebSocketAdapter(new WsAdapter(app));

  const port = process.env.PORT ?? 3005;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}/api/v1`);
}
bootstrap();
