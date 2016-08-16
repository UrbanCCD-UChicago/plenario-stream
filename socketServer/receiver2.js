socket = require('socket.io-client')('http://localhost:8081/');
socket.on('data', function (data) {
        console.log(data);
});
socket.on('internal_error', function (error) {
        console.log(error);
});
