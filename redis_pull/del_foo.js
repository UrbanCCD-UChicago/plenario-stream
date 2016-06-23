// deletes value at key 'foo' for testing purposes

var endpoint = 'test-cluster.bkhf8w.0001.usw2.cache.amazonaws.com',
    redis = require('redis'),
    client = redis.createClient(6379, endpoint);

client.del('foo', function(err, res){
	client.quit();
});
