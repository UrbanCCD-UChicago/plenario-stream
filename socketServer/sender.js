var app = require('express')();
var http = require('http');
var server = http.Server(app);
var io = require('socket.io')(server);

server.listen(3000, function(){
    console.log("listening at http://localhost:3000/");
});

function emit_test() {
    console.log('emitting data');
    io.emit('internal_data', {
        feature_of_interest: "temperature",
        node_id: "ArrayOfThings1",
        sensor: "BMP340",
        results: {
            temperature: 91
        },
        datetime: "2016-05-21T03:28:08"
    });

    io.emit('internal_data', {
        feature_of_interest: "temperature",
        node_id: "ArrayOfThings3",
        sensor: "TMP112",
        results: {
            temperature: 99
        },
        datetime: "2016-05-21T03:28:08"
    });
}

setTimeout(emit_test, 10000);

