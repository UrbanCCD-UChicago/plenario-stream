var socket = require('socket.io-client')('http://localhost:8081/');
socket.emit('data', 'trolololol');