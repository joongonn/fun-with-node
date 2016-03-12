var express = require('express');
var router = express.Router();

var statsManager = require('../stats-manager.js');

router.get('/', function(req, res, next) {
    var regions = ['NA', 'KR']; //FIXME: global consts
    res.render('index', { regions: regions });
});

module.exports = router;