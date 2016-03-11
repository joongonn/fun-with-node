var express = require('express');
var router = express.Router();

var statsManager = require('../stats-manager.js');

router.get('/:name', function(req, res, next) {
    var region = 'na';
    var name = req.params.name;
    var season = 'SEASON2016';
    statsManager.getSummonerSummary(region, season, name)
                .then(summary => res.render('summoner', { summoner: JSON.stringify(summary, null, 4) }))
                .catch(next);
});

module.exports = router;
