const NodeCache = require('node-cache');

// Initialize cache instance with 60-second default TTL
const cache = new NodeCache({ 
  stdTTL: 60,       // Standard time to live in seconds
  checkperiod: 120  // Automatic deletion check interval in seconds
});

module.exports = cache;
