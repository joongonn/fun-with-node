//TODO: configuration library?
//TODO: prime all the static assets eg. profile icons
//TODO: operational: figure out gzipped/lastmodified, incoming connection(pool/backlog settings?)
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var cookieParser = require('cookie-parser'); // useless for now
var bodyParser = require('body-parser'); // useless for now

var app = express();

// our app configurables - only one for now
var riotApiKey = process.env.RIOT_API_KEY;

// our app modules
var appErrors = require('./errors');
var logger = require('./logger'); //TODO: injectable logging config (dev:debug/prod:warn)
var riot = require('./riot')(riotApiKey, logger); // injected
var statsManager = require('./stats-manager')(riot, logger); // injected

// view engine setup
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//app.use(morgan('combined'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Routes
var index = require('./routes/index');
var summoner = require('./routes/summoner')(statsManager); // injected
var match = require('./routes/match')(statsManager); // injected

app.use('/', index);
app.use('/summoner', summoner);
app.use('/match', match);

if (app.get('env') === 'development') {
    var debug = require('./routes/debug');
    app.use('/debug', debug);
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    res.status(404);
    res.render('oops', { message: `We can't find what you're looking for (HTTP 404)` });
});

// error handlers
app.use(function(err, req, res, next) {
    if (err instanceof appErrors.AppError) {
        res.status(err.statusCode);
        res.render('oops', { message: `${err.message} (HTTP ${err.statusCode})` });
    } else {
        var status = err.status || 500;
        res.status(status);
        res.render('error', {
            message: `HTTP ${status}`,
            error: err // will print stacktrace
        });

        // Log all uncaught exceptions
        logger.error(err);
    }
});

module.exports = app;
