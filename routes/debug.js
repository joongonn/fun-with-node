var express = require('express');
var router = express.Router();

var _ = require("underscore");
var cacheManager = require('../cache-manager')

router.get('/empty', function(req, res, next) {
    res.json({});
});

router.get('/cache/keys', function(req, res, next) {
    var allKeys = _.keys(cacheManager.dump());
    allKeys.sort();
    res.json(allKeys);
});

router.get('/cache/key', function(req, res, next) {
    res.json(cacheManager.get(req.query.key));
});

router.get('/cache/full', function(req, res, next) {
    res.json(cacheManager.dump());
});

module.exports = router;
