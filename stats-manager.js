var riot = require('./riot')(process.env.RIOT_API_KEY);
var cacheManager = require('./cache-manager')
var persistenceManager = null; //FIXME: it was a past season, then persist it

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
                              .then(summoner => riot.getSummonerSummary(region, season, summoner.id))
            cacheManager.set(cacheKey, promise.catch(err => cacheManager.evict(cacheKey)));
            return promise;
        }
    }
};
