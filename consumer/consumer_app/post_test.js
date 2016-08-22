var request = require('request');

request.post('http://'+process.env.plenario_host+'/apiary/send_message',
    {json: {name: 'TEST112',
        value: 'Sensor TEST112 ajsdfkjhgasdfkjhgasdfkjhg not found in sensor metadata. ' +
        'Please add this sensor.'}}, function(err, response, body){
        console.log(body);
        if (err) {
            console.log(err);
        }
    });