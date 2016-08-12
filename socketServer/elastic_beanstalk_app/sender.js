var socket = require('socket.io-client')('http://localhost:8080/');
var date = new Date()
socket.emit('internal_data', date.toISOString());

