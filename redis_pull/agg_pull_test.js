// test implementation of redis_pull functions

var redis_pull = require("./redis_pull");
    test_data = require("./test_data"),
    observations = test_data.observations,
    test_metadata = require("./test_metadata"),
    metadata = test_metadata.metadata;
    
redis_pull.pull_node('foo').then(function(res){
	console.log(res);
},function(err){
	console.log(err);
});

redis_pull.update_node(observations,metadata);
