//TODO: figure out gzipped/lastmodified
// CONFIGURATION: http://dailyjs.com/2014/01/02/recipe-for-express-configuration/
//FIXME: log all 500 errors
//FIXME: prime all the static assets eg. profile icons
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var appErrors = require('./errors');
var logger = require('./logger');

var app = express();

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
var summoner = require('./routes/summoner');
var match = require('./routes/match');

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
