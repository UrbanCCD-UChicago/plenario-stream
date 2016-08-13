var app = require('express')();
var http = require('http');
var server = http.Server(app);
var io = require('socket.io')(server);
var util = require('util');

var rooms = {};

io.on('connect', function(socket) {
    // take in client arguments from query.args in the initial handshake
    // if user doesn't pass any args, or doesn't pass a sensor_network arg, stream them everything for AoT
    var args;
    if (socket.handshake.query.args) {
        args = JSON.parse(socket.handshake.query.args);
    }
    else {
        args = {sensor_network: 'ArrayOfThings'}
    }
    if (!(args.sensor_network)){
        args.sensor_network = 'ArrayOfThings'
    }
    if (args.from_consumer){
        // pass filtered 'internal_data' messages from consumer app to 'data' messages received by sockets
        socket.on('internal_data', function (data) {
            var room_args;
            for (room_name in rooms) {
                if (rooms.hasOwnProperty(room_name)) {
                    room_args = JSON.parse(room_name);
                    if ((!room_args.hasOwnProperty('nodes') || (room_args.nodes.indexOf(data.node_id) > -1)) &&
                        (!room_args.hasOwnProperty('features_of_interest') || room_args.features_of_interest.indexOf(data.feature_of_interest) > -1) &&
                        (!room_args.hasOwnProperty('sensors') || (room_args.sensors.indexOf(data.sensor) > -1))) {
                        io.to(room_name).emit('data', data);
                    }
                }
            }
        });
    }
    else {
        // send a GET request to the query API that will return no data, but will identify validation errors
        var validation_query = util.format('http://localhost:5000/v1/api/sensor-networks/%s/query?limit=0', args.sensor_network);
        for (var i = 0; i < Object.keys(args).length; i++) {
            if (Object.keys(args)[i] != 'sensor_network') {
                validation_query += '&' + Object.keys(args)[i] + '=' + args[Object.keys(args)[i]]
            }
        }
        http.get(validation_query, function (response) {
            var output = '';
            response.on('data', function (data) {
                output += data;
            });
            response.on('end', function () {
                if (JSON.parse(output).error) {
                    socket.emit('data', {error: JSON.parse(output).error})
                }
                else {
                    // add socket to a room based on their query arguments
                    socket.join(JSON.stringify(args));
                    if (rooms[JSON.stringify(args)]) {
                        rooms[JSON.stringify(args)]++;
                    }
                    else {
                        rooms[JSON.stringify(args)] = 1;
                    }
                }
            });
        });
        // decrements the correct property of the room object on disconnection
        socket.on('disconnect', function () {
            if (rooms[JSON.stringify(args)] > 1) {
                rooms[JSON.stringify(args)]--;
            }
            else {
                delete rooms[JSON.stringify(args)];
            }
        });
    }
});


server.listen(8081, function(){
    console.log("listening at http://localhost:8081/");
});
