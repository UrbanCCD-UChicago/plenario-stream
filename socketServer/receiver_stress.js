var io = require('socket.io-client');
var os = require('os');

function open_socket() {
    var socket = io.connect('http://streaming.plenar.io/');

    socket.io.engine.on('upgrade', function(transport){
        console.log('upgraded to:');
        console.log(transport.query.transport);
    });
    // socket.on('data', function (data) {
    //     console.log(data);
    // });
    socket.on('internal_error', function (err) {
        console.log(err);
    });
}

function open_recurse(count) {
    setTimeout(function() {
        console.log(count);
        open_socket();
        console.log(os.loadavg()[0]);
        if (os.loadavg()[0] < 4.5) {
            count++;
            open_recurse(count)
        }
    }, 700)
}

open_recurse(1);