var assert  = require("chai").assert;

var riot = require('../../riot')(process.env.RIOT_API_KEY, null);

const REGION = 'na';
const IMMUTABLE_SUMMONER = 'joongo';

describe("[test.riot.js]", function() {

    it("getSummonerByName-1.4", function() {
        return riot.getSummonerByName(REGION, IMMUTABLE_SUMMONER)
                   .then(summoner => {
                        assert.equal(summoner.name, IMMUTABLE_SUMMONER);
                        assert.equal(summoner.id, 75209525);
                    });
    });

    //TODO: etc. arguably meaningless; but running in CI may help catch overlooked version changes
});