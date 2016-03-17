var express = require('express');
var router = express.Router();

var _ = require("underscore");
var cacheManager = require('../cache-manager')

router.get('/cache', function(req, res, next) {
    var allKeys = _.keys(cacheManager.dump());
    allKeys.sort();
    res.json(allKeys);
});

module.exports = router;
