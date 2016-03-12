//FIXME: if past season, check persistence or cache first

var riot = require('./riot')(process.env.RIOT_API_KEY);
var cacheManager = require('./cache-manager')
var persistenceManager = null; //FIXME: it was a past season, then persist it

//FIXME: if 404, may not want to evict it so fast, if 403 log notify fatal error , etc

var self = module.exports = {
    getSummoner: function(region, name) {
        var cacheKey = `/${region}/${name}`;
        var cached = cacheManager.get(cacheKey);

        if (cached) {
            return cached;
        } else {
            var promise = riot.getSummonerByName(region, name);
            cacheManager.set(cacheKey, promise.catch(err => cacheManager.evict(cacheKey)));
            return promise;
        }
    },

    getSummonerSummary: function(region, season, name) {
        var cacheKey = `/${region}/${name}/summary/${season}`;
        var cached = cacheManager.get(cacheKey);

        if (cached) {
            return cached;
        } else {
            var promise = self.getSummoner(region, name)
                              .then(summoner => riot.getSummonerSummary(region, season, summoner.id)
                                                    .then(summary => ({
                                                         summoner: summoner,
                                                         season: season,
                                                         summary : summary
                                                     })));
            cacheManager.set(cacheKey, promise.catch(err => cacheManager.evict(cacheKey)));
            return promise;
        }
    }
};
