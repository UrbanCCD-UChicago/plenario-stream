// Uses 'id' from observations not metadata
// Assumes observation lists contain data from only one node ID

var endpoint = 'plenario-cache-001.eucixb.0001.use1.cache.amazonaws.com',
    redis = require('redis'),
    promise = require('promise');

var pull_node = function(id) {
    var client = redis.createClient(6379, endpoint);
    var prom = new promise(function(fulfill, reject) {
            client.get(id, function(err, value) {
                    client.quit();
                    if(value != null){
                            fulfill(value);
                        }
                    else {
                            reject('No data found for that node ID');
                        }
                });
        });
    return prom
};

var update_node = function(observation) {
    var client = redis.createClient(6379, endpoint);
    var prom = new promise(function(fulfill, reject) {
	client.get(observation['id'], function(err, value) {
	    if(value != null){
		var value_JSON = JSON.parse(value);
		while(value_JSON['Last_hour'][0]['time'] < (Date.now()/1000 - 3600)) {
		    value_JSON['Last_hour'].splice(0,1);
		}
		value_JSON['Last_hour'].push(observation);
		client.set(observation['id'],JSON.stringify(value_JSON),function(err, reply){
			client.quit();
			fulfill();
		    });
	    }
	    else {
		client.set(observation['id'],JSON.stringify({'Last_hour': [observation]}),function(err, reply){
		    client.quit();
		    fulfill();
                });
	    }
	});
    });
    return prom;
};

exports.update_node = update_node;
exports.pull_node = pull_node;
