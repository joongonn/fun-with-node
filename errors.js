function AppError(statusCode, message, cause) {

    this.name = 'AppError';
    this.statusCode = statusCode;
    this.message = message;
    this.cause = cause;

    if (Error.captureStackTrace) {
        Error.captureStackTrace(this);
    }
}

AppError.prototype = Object.create(Error.prototype);
AppError.prototype.constructor = AppError;

module.exports = {
    AppError: AppError
};