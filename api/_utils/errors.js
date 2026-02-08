
/**
 * Standardized Error Classes
 */

class AppError extends Error {
    constructor(message, statusCode, code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true; // Trusted error caused by known issue
    }
}

export class ValidationError extends AppError {
    constructor(message = "Invalid input data") {
        super(message, 400, "VALIDATION_ERROR");
    }
}

export class ConflictError extends AppError {
    constructor(message = "Resource already exists") {
        super(message, 409, "CONFLICT_ERROR");
    }
}

export class ServiceError extends AppError {
    constructor(message = "External service failed") {
        super(message, 503, "SERVICE_ERROR");
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized access") {
        super(message, 401, "UNAUTHORIZED");
    }
}

export class ForbiddenError extends AppError {
    constructor(message = "Access forbidden") {
        super(message, 403, "FORBIDDEN");
    }
}
