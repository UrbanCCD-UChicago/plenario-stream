var pg = require('pg');


var user = process.env.DBUSER;
var pass = process.env.DBPASS;
var host = process.env.DBHOST;
var port = process.env.DBPORT;
var name = process.env.DBNAME;


var connectionString = `postgres://${user}:${pass}@${host}:${port}/${name}`;
var postgresClient = new pg.Client(connectionString);
postgresClient.connect();


function queryRedshift(queryString) {
  var query = postgresClient.query(queryString);
  return new Promise(function (resolve, reject) {
    result = [];
    query.on('row', function(row) {
      result.push(row);
    });

    query.on('end', function() {
      resolve(result);
    });
  })
}


exports.query = queryRedshift;
