import type { ErrorRequestHandler } from 'express';

export interface HttpError extends Error {
  code?: string;
  status?: number;
}

const errorHandlingMiddleware: ErrorRequestHandler = (err: HttpError, _req, res, _next) => {
  const code = err.code || 'unknown';
  const status = err.status || 500;
  const message = err.message || 'An unknown error occurred';

  if (status >= 500) {
    console.error(err);
  }

  res.status(status);
  res.json({ code, message });
};

export default errorHandlingMiddleware;
