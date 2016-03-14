var logger = require('./logger');
var rp = require('request-promise');

const HOSTS = {
    'NA' : 'https://naz.api.pvp.net', //FIXME: this assumes same version across all regions
    'KR' : 'https://kr.api.pvp.net'
};


function handleError(err) {
    // https://github.com/request/request-promise
    //FIXME: wrap and inform stats/view layer on what to do (retry soon, give up, or NO SUCH PLAYER)
    throw err;
}

//FIXME: timeouts,poolsize
module.exports = function(apiKey) {
    if (!apiKey) {
        throw new Error('Riot API key must be provided');
    }

    return {
        getSummonerByName: function(region, name) { //FIXME: batched query (names), tolowercase the name
            const version = 1.4;
            var options = {
                uri: `${HOSTS[region]}/api/lol/${region}/v${version}/summoner/by-name/${name}?api_key=${apiKey}`,
                json: true
            };
            logger.debug(`Calling Riot for [getSummonerByName(${region}, ${name})] at [${options.uri}] ...`);
            return rp(options).catch(handleError)
                              .then(json => json[name]);
        },

        getSummonerSummary: function(region, season, summonerId) {
            const version = 1.3;
            var options = {
                uri: `${HOSTS[region]}/api/lol/${region}/v${version}/stats/by-summoner/${summonerId}/summary?season=${season}&api_key=${apiKey}`,
                json: true
            };
            logger.debug(`Calling Riot for [getSummonerSummary(${region}, ${season}, ${summonerId})] at [${options.uri}] ...`);
            return rp(options).catch(handleError);
        }
    };
}

//REMINDER: singleton 'by default'
//TODO: versioning? 
//TODO: call counting?
//FIXME: 404 may indicate "no such summoner"