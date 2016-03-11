//TODO: LRU this thing
var processCache = { //FIXME: contains promises; BUT what if it's a centrally backed Redis Cache
  // key: promise 
  //      VS
  // key: jsonObject
};

// Distributed, non-transactional cache

module.exports = {
    get: function(cacheKey) {
        return processCache[cacheKey];
    },

    set: function(cacheKey, thing) {
        processCache[cacheKey] = thing;
    },

    evict: function(cacheKey) {
        delete processCache[cacheKey];
    }
};
