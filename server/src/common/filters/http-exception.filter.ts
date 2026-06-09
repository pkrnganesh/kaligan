import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resObj = exception.getResponse();
      if (typeof resObj === 'object' && resObj !== null) {
        message = (resObj as any).message || exception.message;
        code = (resObj as any).error || 'BAD_REQUEST';
        if (Array.isArray(message)) {
          message = message.join(', ');
        }
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      code = exception.name || 'ERROR';
    }

    const isProd = process.env.NODE_ENV === 'production';
    if (status === HttpStatus.INTERNAL_SERVER_ERROR && isProd) {
      message = 'Internal server error';
    }

    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status} - Error: ${
        exception instanceof Error ? exception.stack : JSON.stringify(exception)
      }`,
    );

    response.status(status).json({
      error: {
        code,
        message,
      },
    });
  }
}
