var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
    socket.on('message', function(msg){
        io.emit('message', msg);
    });
});

http.listen(80, function(){
    console.log('listening on http://54.152.59.142/');
});
