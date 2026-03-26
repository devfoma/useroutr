import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

const codeMap: Record<number, string> = {
  400: 'invalid_request',
  401: 'unauthorized',
  404: 'not_found',
  409: 'quote_expired',
  422: 'insufficient_liquidity',
  429: 'rate_limited',
  500: 'internal_error',
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = codeMap[HttpStatus.INTERNAL_SERVER_ERROR];
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;
      
      code = exceptionResponse.code || codeMap[status] || 'unknown_error';
      message = typeof exceptionResponse === 'string' ? exceptionResponse : (exceptionResponse.message || message);
      details = exceptionResponse.details;
    } else if (exception instanceof Error) {
      if (process.env.NODE_ENV !== 'production') {
        message = exception.message;
        details = exception.stack;
      }
    }

    if (!code) {
      code = 'internal_error';
    }

    // specific handling for 404 unknown routes
    if (status === HttpStatus.NOT_FOUND && message.includes('Cannot ')) {
      message = 'Resource not found';
      code = 'not_found';
    }

    const errorResponse = {
      error: {
        code,
        message: Array.isArray(message) ? message[0] : message,
        docs: `https://docs.useroutr.io/errors/${code}`,
        ...(details ? { details } : {}),
      },
    };

    response.status(status).json(errorResponse);
  }
}
