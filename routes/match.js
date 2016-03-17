var express = require('express');
var router = express.Router();

var statsManager = require('../stats-manager');

router.get('/:region/:id/json', function(req, res, next) {
    var region = req.params.region;
    var id = req.params.id;

    statsManager.getMatch(region, id)
                .then(match => res.json(match))
                .catch(next);
});

module.exports = router;
