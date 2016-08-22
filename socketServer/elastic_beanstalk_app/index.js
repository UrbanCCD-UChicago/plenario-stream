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
            console.log('ERROR: consumer_token authentication failed');
            socket.disconnect()
        }
    }
    else block: {
        console.log(socket.handshake);
        // take in client arguments from query.args in the initial handshake
        // if user doesn't pass any args, or doesn't pass a sensor_network arg, stream them everything from AoT
        var args = {};
        try {
            if (socket.handshake.query.nodes) {
                var nodes = socket.handshake.query.nodes;
                if (!Array.isArray(nodes)) {
                    nodes.replace('[', '');
                    nodes.replace(']', '');
                    nodes = nodes.split(',');
                }
                args.nodes = nodes
            }
            if (socket.handshake.query.features_of_interest) {
                var features = socket.handshake.query.features_of_interest;
                if (!Array.isArray(features)) {
                    features.replace('[', '');
                    features.replace(']', '');
                    features = features.split(',');
                }
                args.features_of_interest = features
            }
            if (socket.handshake.query.sensors) {
                var sensors = socket.handshake.query.sensors;
                if (!Array.isArray(sensors)) {
                    sensors.replace('[', '');
                    sensors.replace(']', '');
                    sensors = sensors.split(',');
                }
                args.sensors = sensors
            }
        }
        catch (err) {
            socket.emit('internal_error', 'Could not parse query args. ' + err);
            socket.disconnect();
            break block
        }
        if (!(socket.handshake.query.sensor_network)) {
            args.sensor_network = 'ArrayOfThings'
        }
        else {
            args.sensor_network = socket.handshake.query.sensor_network
        }
        console.log(args);
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
                // if the user gives invalid query args and plenar.io throws an error,
                // JSON.parse will try to parse html and fail
                try {
                    if (JSON.parse(output).error) {
                        socket.emit('internal_error', JSON.parse(output).error);
                        socket.disconnect()
                    }
                    else {
                        // add socket to a room based on its query arguments
                        socket.join(JSON.stringify(args));
                        if (rooms[JSON.stringify(args)]) {
                            rooms[JSON.stringify(args)]++;
                        }
                        else {
                            rooms[JSON.stringify(args)] = 1;
                        }
                        console.log('rooms open:')
                        console.log(rooms)
                    }
                }
                catch(err) {
                    socket.emit('internal_error', 'Error parsing validation query return. '+err);
                    socket.disconnect();
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
