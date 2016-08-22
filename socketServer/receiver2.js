socket = require('socket.io-client')('http://streaming.plenar.io/');
socket.on('data', function (data) {
        console.log(data);
});
socket.on('internal_error', function (error) {
        console.log(error);
});
