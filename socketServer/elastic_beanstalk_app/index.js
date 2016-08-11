var app = require("express")();
var validator = require("./validator");

app.get('/', function(request, response) {

  if (Object.keys(request.query) <= 0) {
    response.send("No params. :(");
  }

  for (var key in request.query) {
    if (!(key in validator)) {
      response.send("Invalid param.");
      continue;
    }
    
    validator[key](request.query[key]).then(function(result) {
      var valid = result;
      if (!valid) {
        response.send(key + " contains an invalid value.");
      } else {
        response.send("Nice param!");
      }
    });
  }
});

app.listen(8081);
