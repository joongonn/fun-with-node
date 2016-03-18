var assert  = require("chai").assert;

var riot = require('../../riot')(process.env.RIOT_API_KEY, null);
var statsManager = require('../../stats-manager')(riot, null)

const REGION = 'na';
const IMMUTABLE_SUMMONER = 'joongo';
const SEASON = 'SEASON2016';

describe("[test.stats-manager.js]", function() {

    it("getSummonerFull", function() {
        return statsManager.getSummonerFull(REGION, SEASON, IMMUTABLE_SUMMONER)
                           .then(full => {
                                assert.equal(full.summoner.name, IMMUTABLE_SUMMONER);
                                assert.isDefined(full.summary);
                                assert.isDefined(full.ranked);
                                assert.isDefined(full.gameRecent);
                                assert.isDefined(full.lookups);
                                //TODO: other critical fields present
                                //TODO: inspect content required for view rendering
                            });
    });
});
