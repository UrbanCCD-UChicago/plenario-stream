var socket = require('socket.io-client')('http://localhost:8081/', {query: 'args={"sensors":["PRE450"]}'});
socket.on('data', function (data) {
        console.log(data);
});
socket.on('internal_error', function (err) {
        console.log(err);
});
