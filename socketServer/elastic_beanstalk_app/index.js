var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var redis_pull = require('./redis_pull');

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
    socket.on('data', function(msg){
        io.emit('data', msg);
    });
    socket.emit('data', 'Observations from the past hour:');
    redis_pull.pull_node('foo1').then(function(res){
	for(var i = 0 ; i < JSON.parse(res)['Last_hour'].length ; i++){
	    socket.emit('data', JSON.stringify(JSON.parse(res)['Last_hour'][i]));
	}
    },function(err){
	io.emit('data',err);
    });
});

http.listen(8081, function(){
    console.log("listening at http://52.205.163.213:8081/");
});
