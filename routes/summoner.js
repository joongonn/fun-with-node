var express = require('express');
var router = express.Router();
var humanizeDuration = require('humanize-duration')

var logger = require('../logger');

var statsManager = require('../stats-manager');

const season = 'SEASON2016'; //FIXME: global const this?

router.get('/:region/:name', function(req, res, next) {
    var region = req.params.region;
    var name = req.params.name;

    statsManager.getSummonerSummary(region, season, name)
                .then(summary => res.render('summoner', {
                     humanizeDuration: humanizeDuration, //TODO: way to register view functions globally?
                     season: season,
                     summoner: summary.summoner,
                     summary: summary.summary
                 }))
                .catch(next);
});

router.get('/:region/:name/refresh', function(req, res, next) {
    var region = req.params.region;
    var name = req.params.name;

    //TODO: this can return raw json data to the browser instead, for in-place view update
    statsManager.getSummonerSummary(region, season, name, true)
                .then(summary => res.sendStatus(204));
});

module.exports = router;
