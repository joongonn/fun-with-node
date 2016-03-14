//FIXME: when remote is down, retries
//Decides whether or not to auto refresh here
//FIXME: if past season, check persistence or cache first
//HOT: players (precache)

var riot = require('./riot')(process.env.RIOT_API_KEY);
var cacheManager = require('./cache-manager')
var persistenceManager = null; //FIXME: it was a past season, then persist it

//FIXME: if 404, may not want to evict it so fast, if 403 log notify fatal error , etc

function setRefreshedDate(obj) {
   obj.$refreshDate = (new Date).getTime();
   return obj;
}

var self = module.exports = {
    getSummoner: function(region, name, forceRefresh) {
        var cacheKey = `/${region}/${name}`;
        var cached = !forceRefresh && cacheManager.get(cacheKey);

        if (cached) {
            return cached;
        } else {
            var promise = riot.getSummonerByName(region, name).then(setRefreshedDate);
            cacheManager.set(cacheKey, promise.catch(err => cacheManager.evict(cacheKey)));
            return promise;
        }
    },

    //FIXME: Can be null
    getSummonerSummary: function(region, season, name, forceRefresh) {
        var cacheKey = `/${region}/${name}/summary/${season}`;
        var cached = !forceRefresh && cacheManager.get(cacheKey);

        if (cached) { //TODO: check cache age against configured
            return cached;
        } else {
            var promise = self.getSummoner(region, name, forceRefresh)
                              .then(summoner => riot.getSummonerSummary(region, season, summoner.id)
                                                    .then(setRefreshedDate)
                                                    .then(summary => {
                                                         summary.$season = season;
                                                         return {
                                                             summoner: summoner,
                                                             summary : summary
                                                         };
                                                     }));
            cacheManager.set(cacheKey, promise.catch(err => cacheManager.evict(cacheKey)));
            return promise;
        }
    }
};
