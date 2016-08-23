var socket = require('socket.io-client')('http://streaming.plenar.io?' +
    'sensor_network=TestNetwork');
var count = 0;

socket.on('data', function (data) {
    count++;
    console.log(data);
});
socket.on('internal_error', function (err) {
    console.log(err);
});
