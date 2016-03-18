var winston = require('winston');

function formatter(args) {
    var timestamp = new Date().toISOString()
    var message = args.message;
    if (!message && args.meta) {
        message = `Exception stacktrace: ${args.meta.stack}`;
    }

    return `${timestamp} [${args.level.toUpperCase()}] ${message}`;
}

var logger = new winston.Logger({
    transports: [
        //TODO: rolling file appender
        //TODO: injected, centralized config
        new winston.transports.Console({
            level: 'debug',
            handleExceptions: true,
            json: false,
            formatter: formatter
        })
    ],
    exitOnError: false
});

module.exports = logger;
