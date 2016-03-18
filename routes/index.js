var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    var regions = ['na', 'kr']; //FIXME: global consts
    res.render('index', { regions: regions });
});

module.exports = router;
