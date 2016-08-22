var socket = require('socket.io-client')('http://streaming.plenar.io?sensor_network=TestNetwork&sensors=sensor4');

socket.on('data', function (data) {
    console.log(data);
});
socket.on('internal_error', function (err) {
    console.log(err);
});
