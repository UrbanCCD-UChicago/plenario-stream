'use strict';

// satisfies Promise needs of pg-pool running underneath pg
global.Promise = require('promise');

var fs = require('fs');
var util = require('util');
var pg = require('pg');
var kcl = require('../');
var logger = require('../util/logger');
var external_IP = process.env.socket_server; // external IP address of socket.io app
var mapper = require('../mapper');

/**
 * Be careful not to use the 'stderr'/'stdout'/'console' as log destination since it is used to communicate with the
 * {https://github.com/awslabs/amazon-kinesis-client/blob/master/src/main/java/com/amazonaws/services/kinesis/multilang/package-info.java MultiLangDaemon}.
 */

function recordProcessor() {
    var log = logger().getLogger('recordProcessor');
    var shardId;
    var socket = require('socket.io-client')('http://' + external_IP + '/', {reconnect: true, query: 'consumer_token='+process.env.consumer_token});
    var pg_config = {
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        max: 10,
        idleTimeoutMillis: 30000
    };
    var rs_config = {
        user: process.env.RS_USER,
        database: process.env.RS_NAME,
        password: process.env.RS_PASSWORD,
        host: process.env.RS_HOST,
        port: process.env.RS_PORT,
        max: 10,
        idleTimeoutMillis: 30000
    };
    var rs_pool = new pg.Pool(rs_config);
    var pg_pool = new pg.Pool(pg_config);
    var map = {};

    return {

        initialize: function (initializeInput, completeCallback) {
            log.info('In initialize');
            shardId = initializeInput.shardId;
            mapper.update_map(pg_pool).then(function (new_map) {
                map = new_map;
                completeCallback();
            }, function (err) {
                log.info('error connecting to postgres: ', err);
                completeCallback();
            });
        },

        processRecords: function (processRecordsInput, completeCallback) {
            log.info('In processRecords');
            if (!processRecordsInput || !processRecordsInput.records) {
                completeCallback();
                return;
            }
            var records = processRecordsInput.records;
            var record, data, sequenceNumber, partitionKey;
            for (var i = 0; i < records.length; ++i) {
                record = records[i];
                data = new Buffer(record.data, 'base64').toString();
                sequenceNumber = record.sequenceNumber;
                partitionKey = record.partitionKey;
                // assumes a string is being read from the stream
                if (mapper.parse_insert_emit(JSON.parse(data), map, pg_pool, rs_pool, socket) == true) {
                    mapper.update_map(pg_pool).then(function (new_map) {
                        map = new_map;
                        log.info('sensor mapping updated');
                    }, function (err){
                        log.info('error updating sensor mapping: ', err);
                    })
                }
                log.info(util.format('ShardID: %s, Record: %s, SeqenceNumber: %s, PartitionKey:%s', shardId, data, sequenceNumber, partitionKey));
            }
            if (!sequenceNumber) {
                completeCallback();
                return;
            }
            // If checkpointing, completeCallback should only be called once checkpoint is complete.
            processRecordsInput.checkpointer.checkpoint(sequenceNumber, function (err, sequenceNumber) {
                log.info(util.format('Checkpoint successful. ShardID: %s, SeqenceNumber: %s', shardId, sequenceNumber));
                completeCallback();
            });
        },

        shutdown: function (shutdownInput, completeCallback) {
            // Checkpoint should only be performed when shutdown reason is TERMINATE.
            if (shutdownInput.reason !== 'TERMINATE') {
                completeCallback();
                return;
            }
            // Whenever checkpointing, completeCallback should only be invoked once checkpoint is complete.
            shutdownInput.checkpointer.checkpoint(function (err) {
                completeCallback();
            });
        }
    };
}

kcl(recordProcessor()).run();