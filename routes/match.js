var express = require('express');
var router = express.Router();

var statsManager = require('../stats-manager');

router.get('/:region/:id', function(req, res, next) {
    var region = req.params.region;
    var id = req.params.id;

    statsManager.getMatch(region, id)
                .then(match => res.render('match', { match: match }))
                .catch(next);
});

module.exports = router;
