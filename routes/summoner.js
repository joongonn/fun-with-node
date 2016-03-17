var express = require('express');
var router = express.Router();
var humanizeDuration = require('humanize-duration')

var logger = require('../logger');

var statsManager = require('../stats-manager');

const season = 'SEASON2016'; //FIXME: global const this?

router.get('/:region/:name', function(req, res, next) {
    var region = req.params.region;
    var name = req.params.name;

    statsManager.getSummonerFull(region, season, name)
                .then(full => res.render('summoner', {
                    humanizeDuration: humanizeDuration, //TODO: way to register view functions globally?
                    season: season,
                    summoner: full.summoner,
                    summary: full.summary,
                    gameRecent: full.gameRecent,
                    ranked: full.ranked,
                    lookups: full.lookups
                 }))
                .catch(next);
});

router.get('/:region/:name/json', function(req, res, next) {
    var region = req.params.region;
    var name = req.params.name;

    statsManager.getSummonerFull(region, season, name)
                .then(full => res.json(full))
                .catch(next);
});

router.get('/:region/:name/refresh', function(req, res, next) {
    var region = req.params.region;
    var name = req.params.name;

    //TODO: this can return raw json data to the browser instead, for in-place view update
    statsManager.getSummonerFull(region, season, name, true)
                .then(summary => res.sendStatus(204))
                .catch(next);
});

module.exports = router;
