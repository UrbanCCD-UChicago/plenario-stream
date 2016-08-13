var io = require('socket.io-client');
var socket = io.connect('http://localhost:8081/', {query: 'args={"from_consumer": "true"}'});
socket.emit('internal_data', {
feature_of_interest: "temperature",
node_id: "ArrayOfThings1",
sensor: "BMP340",
results: {
temperature: 91
},
datetime: "2016-05-21T03:28:08"
});
socket.emit('internal_data', {
feature_of_interest: "temperature",
node_id: "ArrayOfThings3",
sensor: "TMP112",
results: {
temperature: 99
},
datetime: "2016-05-21T03:28:08"
});
