var io = require('socket.io-client');
var fs = require('fs');

var socket = io.connect('http://localhost:8080/test_args');
socket.on('data', function (data) {
  	// fs.writeFile('datatest.txt', JSON.stringify(data));
	console.log(JSON.stringify(data));
});

