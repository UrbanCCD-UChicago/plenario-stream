/***
 Copyright 2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

 Licensed under the Amazon Software License (the "License").
 You may not use this file except in compliance with the License.
 A copy of the License is located at

 http://aws.amazon.com/asl/

 or in the "license" file accompanying this file. This file is distributed
 on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 express or implied. See the License for the specific language governing
 permissions and limitations under the License.
 ***/

'use strict';
// satisfies Promise needs of pg-pool running underneath pg
global.Promise = require('promise');

var fs = require('fs');
var path = require('path');
var util = require('util');
var pg = require('pg');
var kcl = require('../');
var logger = require('../util/logger');
var external_IP = '52.0.235.224'; // external IP address of socket.io app
var mapper = require('../mapper');

/**
 * A simple implementation for the record processor (consumer) that simply writes the data to a log file.
 *
 * Be careful not to use the 'stderr'/'stdout'/'console' as log destination since it is used to communicate with the
 * {https://github.com/awslabs/amazon-kinesis-client/blob/master/src/main/java/com/amazonaws/services/kinesis/multilang/package-info.java MultiLangDaemon}.
 */

function recordProcessor() {
    var log = logger().getLogger('recordProcessor');
    var shardId;
    var socket = require('socket.io-client')('http://'+external_IP+':80/');
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
    var map = {};

    return {

        initialize: function(initializeInput, completeCallback) {
            log.info('In initialize');
            shardId = initializeInput.shardId;
            socket.emit('data', 'Kinesis Connected');
            mapper.update_map(pg_pool).then(function (new_map) {
                map = new_map;
                completeCallback();
            }, function (err) {
                log.info('error connecting to postgres ', err);
                completeCallback();
            });
        },

        processRecords: function(processRecordsInput, completeCallback) {
            log.info('In processRecords');
            if (!processRecordsInput || !processRecordsInput.records) {
                completeCallback();
                return;
            }
            var records = processRecordsInput.records;
            var record, data, sequenceNumber, partitionKey;
            for (var i = 0 ; i < records.length ; ++i) {
                record = records[i];
                data = new Buffer(record.data, 'base64').toString();
                sequenceNumber = record.sequenceNumber;
                partitionKey = record.partitionKey;
                mapper.parse_insert_emit(JSON.parse(data), map, pg_pool, rs_pool, socket);
                log.info(util.format('ShardID: %s, Record: %s, SeqenceNumber: %s, PartitionKey:%s', shardId, data, sequenceNumber, partitionKey));
            }
            if (!sequenceNumber) {
                completeCallback();
                return;
            }
            // If checkpointing, completeCallback should only be called once checkpoint is complete.
            processRecordsInput.checkpointer.checkpoint(sequenceNumber, function(err, sequenceNumber) {
                log.info(util.format('Checkpoint successful. ShardID: %s, SeqenceNumber: %s', shardId, sequenceNumber));
                completeCallback();
            });
        },

        shutdown: function(shutdownInput, completeCallback) {
            // Checkpoint should only be performed when shutdown reason is TERMINATE.
            if (shutdownInput.reason !== 'TERMINATE') {
                completeCallback();
                return;
            }
            // Whenever checkpointing, completeCallback should only be invoked once checkpoint is complete.
            shutdownInput.checkpointer.checkpoint(function(err) {
                completeCallback();
            });
        }
    };
}

kcl(recordProcessor()).run();

