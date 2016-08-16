var util = require('util');
var http = require('http');
var express = require('express');

var app = express();
var server = http.Server(app);
var io = require('socket.io')(server);

var rooms = {};

io.on('connect', function(socket) {
    if (socket.handshake.query.consumer_token) {
        if (socket.handshake.query.consumer_token == process.env.consumer_token) {
            console.log('consumer connected');
            // pass filtered 'internal_data' messages from consumer app to 'data' messages received by sockets
            socket.on('internal_data', function (data) {
                var room_args;
                for (room_name in rooms) {
                    if (rooms.hasOwnProperty(room_name)) {
                        room_args = JSON.parse(room_name);
                        if (((!room_args.nodes) || (room_args.nodes.indexOf(data.node_id) > -1)) &&
                            ((!room_args.features_of_interest) || (room_args.features_of_interest.indexOf(data.feature_of_interest) > -1)) &&
                            ((!room_args.sensors) || (room_args.sensors.indexOf(data.sensor) > -1))) {
                            io.to(room_name).emit('data', data);
                        }
                    }
                }
            });
        }
        else {
            socket.emit('internal_error', 'consumer_token authentication failed');
        }
    }
    else {
        console.log('client connected');
        // take in client arguments from query.args in the initial handshake
        // if user doesn't pass any args, or doesn't pass a sensor_network arg, stream them everything for AoT
        var args;
        if (socket.handshake.query.args) {
            args = JSON.parse(socket.handshake.query.args);
            if (!(args.sensor_network)) {
                args.sensor_network = 'ArrayOfThings'
            }
        }
        else {
            args = {sensor_network: 'ArrayOfThings'}
        }
        // send a GET request to the query API that will return no data, but will identify validation errors
        var validation_query = util.format('http://'+process.env.plenario_host+'/v1/api/sensor-networks/%s/query?limit=0', args.sensor_network);
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
                    socket.emit('internal_error', JSON.parse(output).error);
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
                    console.log(rooms);
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
    console.log("listening for clients on port 80 ==> 8081");
});
