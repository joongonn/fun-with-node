//TODO: request batching/coalescing/serialized dispatcher
var urlencode = require('urlencode');
var rp = require('request-promise');
var errors = require('request-promise/errors');
var appErrors = require('./errors');

var logger = require('./logger');

//TODO: injectable config
//TODO: versioning strategy if any/possible?
const HOSTS = {
    'na' : 'https://na.api.pvp.net',
    'kr' : 'https://kr.api.pvp.net'
};

//TODO: (http)connection timeouts,poolsize,where are they configured?
module.exports = function(apiKey, logger) {
    if (!apiKey) {
        throw new Error('Riot API key must be provided');
    }
    if (logger === undefined) {
        throw new Error('Logger must be provided');
    }

    var handleError = function(call) {
        return function(err) {
            if (err instanceof errors.RequestError) {
                // eg. networking error

            } else if (err instanceof errors.StatusCodeError) {
                //TODO: handle nicely, wrap, etc
                switch (err.statusCode) {
                    case 404: {
                        if (logger) {
                            logger.debug(`Returning [null] for call:[${call}]`);
                        }
                        return null;
                    }
                    case 429: throw new appErrors.AppError(503, 'Exceeded Riot API limit, please try again later', err);
                    // etc
                }
            }

            throw err;
        }
    };


    return {
        getStaticDataChampions: function(region) {
            const version = 1.2;
            var options = {
                uri: `https://global.api.pvp.net/api/lol/static-data/${region}/v${version}/champion?api_key=${apiKey}`,
                json: true
            }
            var call = `getStaticDataChampions(${region})`;
            if (logger) {
                logger.debug(`Calling Riot for [${call}] at [${options.uri}] ...`);
            }

            return rp(options).catch(handleError(call));
        },

        getSummonerNames: function(region, summonerIds) {
            const version = 1.4;
            summonerIdsPart = summonerIds.join(); // to csv
            var options = {
                uri: `${HOSTS[region]}/api/lol/${region}/v${version}/summoner/${summonerIdsPart}/name?api_key=${apiKey}`,
                json: true
            };
            var call = `getSummonerNames(${region}, <${summonerIds.length} ids>)`;
            if (logger) {
                logger.debug(`Calling Riot for [${call}] at [${options.uri.substring(0, 60)}...] ...`);
            }

            return rp(options).catch(handleError(call));
        },

        getSummonerByName: function(region, name) {
            const version = 1.4;
            var options = {
                uri: `${HOSTS[region]}/api/lol/${region}/v${version}/summoner/by-name/${urlencode(name)}?api_key=${apiKey}`,
                json: true
            };
            var call = `getSummonerByName(${region}, ${name})`;
            if (logger) {
                logger.debug(`Calling Riot for [${call}] at [${options.uri}] ...`);
            }

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
            if (logger) {
                logger.debug(`Calling Riot for [${call}] at [${options.uri}] ...`);
            }

            return rp(options).catch(handleError(call));
        },

        getStatsRanked: function(region, season, summonerId) {
            const version = 1.3;
            var options = {
                uri: `${HOSTS[region]}/api/lol/${region}/v${version}/stats/by-summoner/${summonerId}/ranked?season=${season}&api_key=${apiKey}`,
                json: true
            };
            var call = `getStatsRanked(${region}, ${season}, ${summonerId})`;
            if (logger) {
                logger.debug(`Calling Riot for [${call}] at [${options.uri}] ...`);
            }
            
            return rp(options).catch(handleError(call));
        },

        getGameRecent: function(region, summonerId) {
            const version = 1.3;
            var options = {
                uri: `${HOSTS[region]}/api/lol/${region}/v${version}/game/by-summoner/${summonerId}/recent?api_key=${apiKey}`,
                json: true
            };
            var call = `getGameRecent(${region}, ${summonerId})`;
            if (logger) {
                logger.debug(`Calling Riot for [${call}] at [${options.uri}] ...`);
            }
            
            return rp(options).catch(handleError(call));
        },

        getMatch: function(region, matchId) {
            const version = 2.2;
            var options = {
                uri: `${HOSTS[region]}/api/lol/${region}/v${version}/match/${matchId}?api_key=${apiKey}`,
                json: true
            };
            var call = `getMatch(${region}, ${matchId})`;
            if (logger) {
                logger.debug(`Calling Riot for [${call}] at [${options.uri}] ...`);
            }
            
            return rp(options).catch(handleError(call));
        }
    };
}

//REMINDER: singleton 'by default'
//TODO: call counting?
