var rp = require('request-promise');

//FIXME: timeouts,poolsize
module.exports = function(apiKey) {
    if (!apiKey) {
        throw new Error('Riot API key must be provided');
    }

    const host = 'https://na.api.pvp.net'; //FIXME: region?

    return {
        getSummonerByName: function(region, name) {
            const version = 1.4;
            var options = {
                uri: host + `/api/lol/${region}/v${version}/summoner/by-name/${name}?api_key=${apiKey}`,
                json: true
            };
            console.log(`Calling Riot for [getSummonerByName] at [${options.uri}] ...`);
            return rp(options).then(json => json[name]);
        },

        getSummonerSummary: function(region, season, summonerId) {
            const version = 1.3;
            var options = {
                uri: host + `/api/lol/${region}/v${version}/stats/by-summoner/${summonerId}/summary?season=${season}&api_key=${apiKey}`,
                json: true
            };
            console.log(`Calling Riot for [getSummonerSummary] at [${options.uri}] ...`);
            return rp(options);
        }
    };
}

//REMINDER: singleton 'by default'
//TODO: call counting?
//FIXME: 404 may indicate "no such summoner"