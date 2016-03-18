var express = require('express');
var router = express.Router();

module.exports = function(statsManager) {
    if (!statsManager) {
        throw new Error('statsManager must be provided');
    }

    router.get('/:region/:id', function(req, res, next) {
        var region = req.params.region;
        var id = req.params.id;

        statsManager.getMatch(region, id)
                    .then(match => res.render('match', { match: match }))
                    .catch(next);
    });

    return router;
};
