var promise = require('promise');
var util = require('util');

/**
 * pulls from postgres to create most up-to-date mapping of sensor names to array of properties
 *
 * @param {pg.Pool} pg_pool = postgres client pool
 * @return {promise} yields map on fulfillment
 * in format:
 * { TMP112: [ 'temperature.temperature' ],
 * BMP340: [ 'temperature.temperature', 'humidity.humidity' ],
 * UBQ120: [ 'magneticField.X', 'magneticField.Y', 'magneticField.Z' ],
 * PRE450: [ 'atmosphericPressure.pressure' ] }
 */
var update_map = function (pg_pool) {
    var p = new promise(function (fulfill, reject) {
        pg_pool.connect(function (err, client, done) {
            if (err) {
                reject('error connecting client ', err);
            }
            client.query('SELECT * FROM sensor__sensors', function (err, result) {
                done();
                if (err) {
                    reject('error running query ', err);
                }
                var map = {};
                for (var i = 0; i < result.rows.length; i++) {
                    map[result.rows[i].name] = result.rows[i].properties;
                }
                fulfill(map);
            });
        });
    });
    return p
};

/**
 * takes in a sensor reading, inserts it into redshift, and emits it to the socket server
 *
 * @param {Object} obs = observation
 * in format:
 * { "node_id": "0000001e06107cdc",
 *  "node_config": "011ab78",
 *  "datetime": "2016-08-05T00:00:08.246000",
 *  "sensor": "HTU21D",
 *  "data": [37.90, 27.48] }
 * @param {Object} map = sensor name to property array mapping as generated by update_map
 * @param {pg.Pool} pg_pool
 * @param {pg.Pool} rs_pool
 * @param {socket} socket = socket.io client sending data to socket server app
 * @return true if map needs to be updated, false otherwise
 */
var parse_insert_emit = function (obs, map, pg_pool, rs_pool, socket) {
    // pulls postgres immediately if sensor is not known or properties have been added
    if (!(obs['sensor'] in map) ||
        ((obs['sensor'] in map) && (obs['data'].length > map[obs['sensor']].length))) {
        update_map(pg_pool).then(function (new_map) {
            if (!(obs['sensor'] in new_map) ||
                ((obs['sensor'] in new_map) && (obs['data'].length != new_map[obs['sensor']].length))) {
                // this means we don't have the mapping for a sensor and it's not in postgres
                // OR the observation length is larger than what's in postgres
                // send message to metadata manager
                // banish observation to the 'Island of Misfit Values'
                redshift_insert(obs, new_map, rs_pool, true);
                return true
            }
            else {
                // updating the map fixed the discrepancy
                redshift_insert(obs, new_map, rs_pool, false);
                socket.emit('internal_data', obs);
                return true
            }
        }, function (err) {
            // handle error without console
        })
    }
    // preliminary checks show that the mapping will work to input values into the database - go for it
    else {
        redshift_insert(obs, map, rs_pool, false);
        socket.emit('internal_data', obs);
        return false
    }
};

/**
 * inserts observation into redshift
 *
 * @param {Object} obs = observation
 * in format:
 * { "node_id": "0000001e06107cdc",
 *  "node_config": "011ab78", <= if accepted. for now this is replaced by an integer procedure
 *  "datetime": "2016-08-05T00:00:08.246000",
 *  "sensor": "HTU21D",
 *  "data": [37.90, 27.48] }
 * @param {Object} map = sensor name to property array mapping as generated by update_map
 * @param {pg.Pool} rs_pool
 * @param {boolean} misfit = true if FoI table cannot be found then value array must be stored as a string
 * in the 'unknownfeature' table (AKA the 'Island of Misfit Values')
 */
var redshift_insert = function (obs, map, rs_pool, misfit) {
    // works off (nodeid, datetime, sensor, {values}, procedures) database model for now
    // if node_config format is accepted, change this
    rs_pool.connect(function (err, rs_client, done) {
        if (err) {
            // handle error without console
        }
        if (misfit) {
            var query_text = util.format("INSERT INTO unknownfeature " +
                "VALUES ('%s', '%s', '%s', '%s', 1234);", // fake procedure hack
                obs['node_id'], obs['datetime'], obs['sensor'], JSON.stringify(obs['data']));
            rs_client.query(query_text);
            done();
        }
        else {
            var all_features = [];
            for (var i = 0; i < map[obs['sensor']].length; i++) {
                var feature = map[obs['sensor']][i].split('.')[0];
                if (!(feature in all_features)) {
                    all_features.push(feature)
                }
            }
            for (var j = 0; j < all_features.length; j++) {
                var feature = all_features[j];
                var query_text = util.format("INSERT INTO %s (nodeid, datetime, sensor, ", feature.toLowerCase());
                var c = 0;
                for (var k = 0; k < map[obs['sensor']].length; k++) {
                    if (map[obs['sensor']][k].split('.')[0] == feature) {
                        if (c != 0 ){
                            query_text +=  ', '
                        }
                        query_text += map[obs['sensor']][k].split('.')[1];
                        c++;
                    }
                }
                query_text = util.format(query_text + ", procedures) " + // fake procedure hack
                    "VALUES ('%s', '%s', '%s'", obs['node_id'], obs['datetime'], obs['sensor']);
                for (var k = 0; k < map[obs['sensor']].length; k++) {
                    if (map[obs['sensor']][k].split('.')[0] == feature) {
                        query_text += ', ' + obs['data'][k];
                    }
                }
                query_text += ', 1234);'; // fake procedure hack
                console.log(query_text);
                rs_client.query(query_text);
                done();
            }
        }
    });
};

module.exports.update_map = update_map;
module.exports.parse_insert_emit = parse_insert_emit;