var port = 8081; //process.env.PORT || 3000;
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
    socket.on('data', function(msg){
        io.emit('data', msg);
    });
    socket.on('subscription', function(msg){
        io.emit('subscription', msg);
    });
});

http.listen(port, function(){
    console.log("listening at http://52.205.163.213:"+port+"/");
});
