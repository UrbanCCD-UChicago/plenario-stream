"use strict";

var redshift = require("./redshift");


var validateTable = function (tableName) {
  var selectTablenames = "SELECT table_name FROM information_schema.tables"; 
  var conditions = "WHERE table_schema='public' AND table_type='BASE TABLE'";
  
  return new Promise(function (resolve, reject) {
    redshift.query(selectTablenames + " " + conditions).then(function(result) {
      var tableNames = [];
      for (var i in result) {
        var obj = result[i];
        tableNames.push(obj["table_name"]);
      }
      resolve(tableNames.indexOf(tableName) >= 0);
    });
  });
}

function validateNodeid() {
}

function validateDatetime() {
}

function validateSensor() {
}


module.exports = {
  "table": validateTable,
  "nodeid": validateNodeid,
  "datetime": validateDatetime,
  "sensor": validateSensor
}
