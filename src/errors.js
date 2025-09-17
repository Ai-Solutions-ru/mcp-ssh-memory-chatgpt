export class HttpError extends Error {
  constructor(message, statusCode = 500, details = undefined) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ValidationError extends HttpError {
  constructor(message, details) {
    super(message, 400, details);
  }
}

export class ConflictError extends HttpError {
  constructor(message, details) {
    super(message, 409, details);
  }
}

export class NotFoundError extends HttpError {
  constructor(message, details) {
    super(message, 404, details);
  }
}

export class UpstreamError extends HttpError {
  constructor(message, statusCode = 502, details) {
    super(message, statusCode, details);
  }
}
