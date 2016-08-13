var pg = require('pg'),
    mapper = require('./mapper');

var pg_config = {
    user: process.env.DB_USER,
    database:  process.env.DB_NAME,
    password:  process.env.DB_PASSWORD,
    host:  process.env.DB_HOST,
    port:  process.env.DB_PORT,
    max: 10,
    idleTimeoutMillis: 30000
};

var rs_config = {
    user: process.env.RS_USER,
    database:  process.env.RS_NAME,
    password:  process.env.RS_PASSWORD,
    host:  process.env.RS_HOST,
    port:  process.env.RS_PORT,
    max: 10,
    idleTimeoutMillis: 30000
};

var rs_pool = new pg.Pool(rs_config);
var pg_pool = new pg.Pool(pg_config);

var obs = {
    "node_id": "ArrayOfThings1",
    "datetime": "2016-08-05T11:11:11",
    "sensor": "PRE450",
    "data": [40.29]
};

var map = {};

mapper.parse_insert_emit(obs, map, pg_pool, rs_pool, require('socket.io-client')('http://127.0.0.1/'));






