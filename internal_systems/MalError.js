class MalError extends Error {
    constructor(message, status = null, details = null) {
        super(message);
        this.name = "MalError";
        this.status = status;
        this.details = details;
    
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, MalError);
        }
    }
}

module.exports = {
    MalError
}