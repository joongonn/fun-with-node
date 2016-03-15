//FIXME: when remote is down, retries
//Decides whether or not to auto refresh here
//FIXME: if past season, check persistence or cache first
//HOT: players (precache)

var logger = require('./logger');
var riot = require('./riot')(process.env.RIOT_API_KEY);
var cacheManager = require('./cache-manager')
var persistenceManager = null; //FIXME: it was a past season, then persist it

//FIXME: if 404, may not want to evict it so fast, if 403 log notify fatal error , etc

function setRefreshedDate(obj) {
    if (obj) {
        obj.$refreshDate = (new Date).getTime();
    }
    return obj;
}

function evict(cacheKey, err) {
    logger.warn(`Evicting cacheKey:[${cacheKey}] due to error:[${err}] ...`)
    cacheManager.evict(cacheKey);
    throw err;
}

var self = module.exports = {
    getStaticDataChampions: function(region, forceRefresh) {
        var cacheKey = `/static-data/${region}/champion`;
        var cached = !forceRefresh && cacheManager.get(cacheKey);

        if (cached) {
            return cached;
        } else {
            var champions = riot.getStaticDataChampions(region)
                                .then(setRefreshedDate)
                                .catch(err => evict(cacheKey, err));

            cacheManager.set(cacheKey, champions);
            return champions;
        }
    },

    getSummoner: function(region, name, forceRefresh) {
        var cacheKey = `/summoner/${region}/${name}`;
        var cached = !forceRefresh && cacheManager.get(cacheKey);

        if (cached) {
            return cached;
        } else {
            var summoner = riot.getSummonerByName(region, name)
                               .then(setRefreshedDate)
                               .catch(err => evict(cacheKey, err));

            cacheManager.set(cacheKey, summoner);
            return summoner;
        }
    },

    getStatsSummary: function(region, season, summonerId, forceRefresh) {
        var cacheKey = `/stats/${region}/${summonerId}/summary/${season}`;
        var cached = !forceRefresh && cacheManager.get(cacheKey);

        if (cached) {
            return cached;
        } else {
            var summary = riot.getStatsSummary(region, season, summonerId)
                              .then(setRefreshedDate)
                              .catch(err => evict(cacheKey, err));

            cacheManager.set(cacheKey, summary);
            return summary;
        }
    },

    //FIXME: **** how to deal with NO-stats (legitimate 404s)
    getStatsRanked: function(region, season, summonerId, forceRefresh) {
        var cacheKey = `/ranked/${region}/${summonerId}/summary/${season}`;
        var cached = !forceRefresh && cacheManager.get(cacheKey);

        if (cached) {
            return cached;
        } else {
            var ranked = riot.getStatsRanked(region, season, summonerId)
                             .then(setRefreshedDate)
                             .catch(err => evict(cacheKey, err));

            cacheManager.set(cacheKey, ranked);
            return ranked;
        }
    },

    getSummonerFull: function(region, season, name, forceRefresh) {
        var cacheKey = `/full/${region}/${name}/summary/${season}`;
        var cached = !forceRefresh && cacheManager.get(cacheKey);

        if (cached) {
            return cached;
        } else {
            var full = self.getSummoner(region, name, forceRefresh)
                           .then(summoner => {
                                if (!summoner) {
                                    throw new Error(`No such summoner:[${name}]`);
                                }

                                var id = summoner.id;
                                // Parallel outgoing requests (TODO: outgoing pool size?)
                                var all = Promise.all([
                                    self.getStatsSummary(region, season, id, forceRefresh),
                                    self.getStatsRanked(region, season, id, forceRefresh),
                                    self.getStaticDataChampions(region)
                                ]);

                                return all.then(values => ({
                                               summoner: summoner,
                                               summary: values[0],
                                               ranked: values[1],
                                               $season: season,
                                               $champions: values[2]
                                           }));
                            })
                           .then(setRefreshedDate)
                           .catch(err => evict(cacheKey, err));

            cacheManager.set(cacheKey, full);
            return full;
        }
    },
};
