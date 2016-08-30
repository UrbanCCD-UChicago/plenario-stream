var io = require('socket.io-client');

var open_socket = function () {
    var socket = io.connect('http://streaming.plenar.io/',{transports:['websocket','polling']});

    socket.on('data', function (data) {
        console.log(data);
    });
    socket.on('internal_error', function (err) {
        console.log(err);
    });
};

module.exports.open_socket = open_socket;
