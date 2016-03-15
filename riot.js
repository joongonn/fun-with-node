var logger = require('./logger');
var rp = require('request-promise'); // https://github.com/request/request-promise
var errors = require('request-promise/errors');

const HOSTS = {
    'na' : 'https://na.api.pvp.net', //FIXME: this assumes same version across all regions
    'kr' : 'https://kr.api.pvp.net'
};

function handleError(call) {
    return function(err) {
        if (err instanceof errors.RequestError) {
            // eg. networking error

        } else if (err instanceof errors.StatusCodeError) {
            //TODO: handle nicely, wrap, etc
            switch (err.statusCode) {
                case 404: {
                    logger.debug(`Returning [null] for call:[${call}]`);
                    return null;
                }
                case 429: throw new Error('Exceeded API limit, try again later');
                // etc
            }
        }

        throw err;
    }
}

//FIXME: timeouts,poolsize
module.exports = function(apiKey) {
    if (!apiKey) {
        throw new Error('Riot API key must be provided');
    }

    return {
        getStaticDataChampions: function(region) {
            const version = 1.2;
            var options = {
                uri: `https://global.api.pvp.net/api/lol/static-data/${region}/v${version}/champion?api_key=${apiKey}`,
                json: true
            }
            var call = `getStaticDataChampions(${region})`;
            logger.debug(`Calling Riot for [${call}] at [${options.uri}] ...`);

            return rp(options).catch(handleError(call));
        },

        getSummonerByName: function(region, name) { //FIXME: batched query (names), tolowercase the name
            const version = 1.4;
            var options = {
                uri: `${HOSTS[region]}/api/lol/${region}/v${version}/summoner/by-name/${name}?api_key=${apiKey}`,
                json: true
            };
            var call = `getSummonerByName(${region}, ${name})`;
            logger.debug(`Calling Riot for [${call}] at [${options.uri}] ...`);

            return rp(options).catch(handleError(call))
                              .then(summoners => summoners ? summoners[name] : null);
        },

        getStatsSummary: function(region, season, summonerId) {
            const version = 1.3;
            var options = {
                uri: `${HOSTS[region]}/api/lol/${region}/v${version}/stats/by-summoner/${summonerId}/summary?season=${season}&api_key=${apiKey}`,
                json: true
            };
            var call =`getStatsSummary(${region}, ${season}, ${summonerId})`;
            logger.debug(`Calling Riot for [${call}] at [${options.uri}] ...`);

            return rp(options).catch(handleError(call));
        },

        getStatsRanked: function(region, season, summonerId) {
            const version = 1.3;
            var options = {
                uri: `${HOSTS[region]}/api/lol/${region}/v${version}/stats/by-summoner/${summonerId}/ranked?season=${season}&api_key=${apiKey}`,
                json: true
            };
            var call = `getStatsRanked(${region}, ${season}, ${summonerId})`;
            logger.debug(`Calling Riot for [${call}] at [${options.uri}] ...`);
            
            return rp(options).catch(handleError(call));
        }
    };
}

//REMINDER: singleton 'by default'
//TODO: versioning? 
//TODO: call counting?
//FIXME: 404 may indicate "no such summoner"
