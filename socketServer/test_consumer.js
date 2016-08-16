var socket = require('socket.io-client')('http://localhost:8081/', {query: 'consumer_token='+process.env.consumer_token});
setTimeout(function() {
	socket.emit('internal_data', {"node_id": "ArrayOfThings1","datetime": "2016-08-16T19:14:34.767883","sensor": "PRE450","data": [59]});
	socket.emit('internal_data', {"node_id": "ArrayOfThings1","datetime": "2016-08-16T19:14:34.767883","sensor": "TMP112","data": [12]});
}, 10000)
