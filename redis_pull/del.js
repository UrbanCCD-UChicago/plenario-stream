// deletes value at key 'foo' for testing purposes

var endpoint = 'plenario-cache-001.eucixb.0001.use1.cache.amazonaws.com',
    redis = require('redis'),
    client = redis.createClient(6379, endpoint);

client.del(process.argv[2], function(err, res){
	client.quit();
});
