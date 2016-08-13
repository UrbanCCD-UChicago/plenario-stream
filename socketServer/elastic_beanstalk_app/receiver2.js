var io = require('socket.io-client');

var socket = io.connect('http://localhost:8081/', {query: 'args={"nodes": ["ArrayOfThings3"], "features_of_interest": ["temperature"], "sensor_network": "ArrayOfThings"}'});
socket.on('data', function (data) {
        console.log(JSON.stringify(data));
});
