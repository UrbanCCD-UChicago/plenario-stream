var app = require('express')();
var http = require('http');
var server = http.Server(app);
var io = require('socket.io')(server);

// does nothing concerning direct socket connections
app.get('/v1/api/sensor-networks/:network_name/:args?', function(req, res){
    if (req.params.args) {
        console.log(req.params.args.split('&'));
    }
});

io.on('connect', function(socket){
    var now = new Date();
    var hour_ago = new Date(now.getTime() - (1000*60*60));
    // get last hour
    http.get('http://localhost:5000/v1/api/sensor-networks/ArrayOfThings/query?' +
        'start_datetime='+hour_ago.toISOString().replace('Z','') +
        '&end_datetime='+now.toISOString().replace('Z',''), function (response) {
        var output = '';
        response.on('data', function (data) {
            output += data;
        });
        response.on('end', function () {
            socket.emit('data', {"past_hour": JSON.parse(output)['data']});
        });
    });
    //
    io.on('internal_data', function(msg){
        io.emit('data', msg);
    });
});

server.listen(8080, function(){
    console.log("listening at http://localhost:8080/");
});
