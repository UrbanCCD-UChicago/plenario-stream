var io = require('socket.io-emitter')({ host: 'localhost', port: 6379 });
setInterval(function(){
  io.emit('chat message', 'I am a robot');
}, 5000);