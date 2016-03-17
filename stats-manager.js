//FIXME: when remote is down, retries
//Decides whether or not to auto refresh here
//FIXME: if past season, check persistence or cache first
//HOT: players (precache)

var logger = require('./logger');
var riot = require('./riot')(process.env.RIOT_API_KEY);
var cacheManager = require('./cache-manager')
var _ = require("underscore");

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
    //FIXME: client can ask for a championId that does not exist here?
    getStaticDataChampionsLookup: function(region, forceRefresh) {
        var cacheKey = `/lol/static-data/${region}/champion`;
        var cached = forceRefresh ? null : cacheManager.get(cacheKey);

        if (cached) {
            return cached;
        } else {
            var championsLookup = riot.getStaticDataChampions(region)
                                      .then(results => {
                                           var champions = _.values(results.data);
                                           var championsById = _.reduce(champions, (z, champion) => {
                                               z[champion.id] = champion;
                                               return z;
                                           }, {});
                                           championsById.get = id => championsById[id.toString()];
                                           return championsById;
                                       })
                                      .then(setRefreshedDate)
                                      .catch(err => evict(cacheKey, err));

            cacheManager.set(cacheKey, championsLookup);
            return championsLookup;
        }
    },

    getSummoner: function(region, name, forceRefresh) {
        var name = name.toLowerCase().replace(/\s/g, ''); // Eh, undocumented behavior.

        var cacheKey = `/lol/summoner/${region}/${name}`;
        var cached = forceRefresh ? null : cacheManager.get(cacheKey);

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
        var cacheKey = `/lol/stats/summary/${region}/${summonerId}/${season}`;
        var cached = forceRefresh ? null : cacheManager.get(cacheKey);

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

    getStatsRanked: function(region, season, summonerId, forceRefresh) {
        var cacheKey = `/lol/stats/ranked/${region}/${summonerId}/summary/${season}`;
        var cached = forceRefresh ? null : cacheManager.get(cacheKey);

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

    //TODO: Games can be persisted.
    getGameRecent: function(region, summonerId, forceRefresh) {
        var cacheKey = `/lol/game/recent/${region}/${summonerId}`;
        var cached = forceRefresh ? null : cacheManager.get(cacheKey);

        if (cached) {
            return cached;
        } else {
            // process 'fellowPlayers' into teams
            var process = function(resp) {
                if (!resp) {
                    return null; // no recent games
                }

                var mySummonerId = resp.summonerId;
                _.each(resp.games, game => {
                    var fellowPlayers = game.fellowPlayers;
                    var playersByTeamId = _.groupBy(fellowPlayers, player => player.teamId);
                    playersByTeamId = _.mapObject(playersByTeamId, (players, teamId) => {
                        return _.map(players, player => ({ summonerId: player.summonerId, championId: player.championId }));
                    });
                    var teams = _.map(_.pairs(playersByTeamId), pair => ({ teamId: parseInt(pair[0]), players: pair[1] }));
                    // add self into team
                    var myTeamId = game.stats.team;
                    var myTeamWon = game.stats.win;
                    var myTeam = _.find(teams, team => team.teamId == myTeamId);
                    var me = { summonerId: mySummonerId, championId: game.championId };
                    if (myTeam) {
                        myTeam.players.push(me);
                    } else {
                        // 1-v-1 ? push myself into a new team
                        myTeam = { teamId: myTeamId, players: [ me ] };
                        teams.push(myTeam);
                    }
                    _.each(teams, team => team.win = (team.teamId == myTeamId) ? myTeamWon : !myTeamWon);

                    game.$fellowPlayers = {
                      summonerIds: _.map(fellowPlayers, player => player.summonerId),
                      teams: teams
                    };
                });

                // all unique summonerIds seen
                var allSummonerIds = _.uniq(_.flatten(_.map(resp.games, game => game.$fellowPlayers.summonerIds)));
                allSummonerIds.push(mySummonerId);
                allSummonerIds.sort((a,b) => a - b);
                resp.$summonerIds = allSummonerIds;

                return resp;
            };

            var gameRecent = riot.getGameRecent(region, summonerId)
                                 .then(setRefreshedDate)
                                 .then(process)
                                 .catch(err => evict(cacheKey, err));

            cacheManager.set(cacheKey, gameRecent);
            return gameRecent;
        }
    },

    getSummonerNames: function(region, summonerIds) { //FIXME: forceRefresh
        var getCacheKey = summonerId => `/summonerName/${summonerId}`;

        var cacheKeysBySummonerId = _.reduce(summonerIds, (z, id) => { z[id] = getCacheKey(id); return z; }, {});
        var cacheKeys = _.values(cacheKeysBySummonerId);
        var namesByCacheKeys = cacheManager.getMany(cacheKeys);

        // Which of these summonerIds we already have (in cache)?
        var outstandingSummonerIds = [];
        var namesById = {};
        _.each(summonerIds, id => {
            var idStr = id.toString();
            var cachedName = namesByCacheKeys[cacheKeysBySummonerId[idStr]];
            if (cachedName) {
                namesById[idStr] = cachedName;
            } else {
                outstandingSummonerIds.push(id);
            }
        });

        if (outstandingSummonerIds.length > 0) {
            // Batch and fire outstanding summonerIds (groups of 40 ids)
            var batches = [];
            while (outstandingSummonerIds.length > 0) {
                batches.push(outstandingSummonerIds.splice(0, 40));
            }

            var gets = _.map(batches, batch => riot.getSummonerNames(region, batch)
                                                   .then(names => {
                                                        // Eagerly stick the resolved names into cache upon completion of batch
                                                        _.each(_.pairs(names), pair => cacheManager.set(getCacheKey(pair[0]), pair[1]));
                                                        return names;
                                                    }));

            var getSummonerNames = Promise.all(gets)
                                          .then(values => _.reduce(values, (z, value) => {
                                               _.each(value, (v, k) => z[k] = v);
                                               return z;
                                           }, namesById));

            return getSummonerNames;
          } else {
              // fulfil from cache
              return Promise.resolve(namesById);
          }
    },

    getMatch: function(region, matchId) {
        var cacheKey = `/match/${matchId}`;
        var cached = cacheManager.get(cacheKey);

        if (cached) {
            return cached;
        } else {
            var ranked = riot.getMatch(region, matchId)
                             .then(setRefreshedDate)
                             .catch(err => evict(cacheKey, err));

            cacheManager.set(cacheKey, ranked);
            return ranked;
        }
    },

    getSummonerFull: function(region, season, name, forceRefresh) {
        var cacheKey = `/full/${region}/${name}/${season}`;
        var cached = forceRefresh ? null : cacheManager.get(cacheKey);

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
                                    self.getStaticDataChampionsLookup(region),
                                    self.getStatsSummary(region, season, id, forceRefresh),
                                    self.getStatsRanked(region, season, id, forceRefresh),
                                    self.getGameRecent(region, id, forceRefresh)
                                        .then(gameRecent => {
                                             if (gameRecent) {
                                                 return self.getSummonerNames(region, gameRecent.$summonerIds)
                                                            .then(summonerNames => {
                                                                 // Pull names of fellowplayers
                                                                 gameRecent.$region = region;
                                                                 gameRecent.$lookups = {
                                                                     getSummonerNameById: id => summonerNames[id.toString()],
                                                                     summonerNames: summonerNames
                                                                 };
                                                                 return gameRecent;
                                                             });
                                             } else {
                                                 return null;
                                             }
                                         })
                                ]);

                                return all.then(values => ({
                                               summoner: summoner,
                                               summary: values[1],
                                               ranked: values[2],
                                               gameRecent: values[3],
                                               season: season,
                                               lookups: {
                                                   champions: values[0]
                                               }
                                           }));
                            })
                           .then(setRefreshedDate)
                           .catch(err => evict(cacheKey, err));

            cacheManager.set(cacheKey, full);
            return full;
        }
    },
};
