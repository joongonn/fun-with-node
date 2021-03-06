var _ = require("underscore");

//TODO: LRU this thing
var processCache = { //FIXME: contains promises; BUT what if it's a centrally backed Redis Cache
  // key: promise 
  //      VS
  // key: jsonObject
};

// Distributed, non-transactional cache

var self = module.exports = {
    get: function(cacheKey) {
        return processCache[cacheKey]; //TODO: undefined vs null
    },

    getMany: function(cacheKeys) {
        return _.reduce(cacheKeys, (z, key) => {
            z[key] = self.get(key);
            return z;
        }, {});
    },

    set: function(cacheKey, thing) {
        processCache[cacheKey] = thing;
    },

    evict: function(cacheKey) {
        delete processCache[cacheKey];
    },

    dump: function() {
        return processCache;
    }
};
