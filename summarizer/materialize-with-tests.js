/*
Questions:
why the 'id' and 'version' redundancy in observation and metadata? it's never read from observations, only metadata.
the only reason to store version data with observations is to know if a specific observation is faulty due to version change.
do we want that?
 */

function make_node_summary(events, node_meta) {
	var ob_types = node_meta['observation_types'];
	var sensor_summaries = {};
		for(var i=0; i<ob_types.length; i++){
            sensor_summaries[ob_types[i]] = make_sensor_summary(ob_types[i], events);
        }
	return {
		'version': node_meta['version'],
		'sensors': sensor_summaries
	}
}


function make_sensor_summary(ob_type, events) {
	var observations = [];
	for(var i=0; i<events.length; i++){
		observations.push({'val': (events[i])[ob_type], 'time': (events[i])['time']});
	}
	return {
		'observations' : observations
	}
}


function update_node_summary(table, events, node_meta) {
    var ob_types = node_meta['observation_types'];
    table['version'] = node_meta['version'];
    for(var i=0; i<ob_types.length; i++) {
        // deletes values outside one day window
        try {
            while (table['sensors'][ob_types[i]]['observations'][0]['time'] < (Date.now() / 1000 - 86400)) {
                table['sensors'][ob_types[i]]['observations'].splice(0, 1);
            }
        } catch (err) {
            console.log('no ' + ob_types[i] + ' observations within time window in previous table');
        }
        // adds new observations
        // to existing sensors
        if (table['sensors'][ob_types[i]] != undefined) {
            for (var j = 0; j < events.length; j++) {
                table['sensors'][ob_types[i]]['observations'].push((make_sensor_summary(ob_types[i], events))['observations'][j]);
            }
        }
        // to new sensors
        else {
            table['sensors'][ob_types[i]] = {'observations': (make_sensor_summary(ob_types[i], events))};
        }
    }
    return table
}

one_node_observations = [
                         {
                        	 'id': 'foo',
                        	 'version': 1,
                        	 'time': 1465570173,
                        	 'temperature': 77.2,
                        	 'pressure': 29.9
                         },
                         {
                        	 'id': 'foo',
                        	 'version': 1,
                        	 'time': 1465571173,
                        	 'temperature': 85.2,
                        	 'pressure': 32
                         },
                         {
                        	 'id': 'foo',
                        	 'version': 1,
                        	 'time': 1565572173,
                        	 'temperature': 91.1,
                        	 'pressure': 28.1
                         }
                         ];

node_meta = {
		'id': 'foo',
		'version': 1,
		'observation_types': ['temperature', 'pressure']
};

one_node_new_observations = [
    {
        'id': 'foo',
        'version': 2,
        'time': 1567000000,
        'temperature': 80,
        'pressure': 31.1,
        'humidity': .50
    },
    {
        'id': 'foo',
        'version': 2,
        'time': 1567001000,
        'temperature': 74.6,
        'pressure': 28.8,
        'humidity': .53
    }
];

new_node_meta = {
    'id': 'foo',
    'version': 2,
    'observation_types': ['temperature', 'pressure', 'humidity']
};

// tests functions
console.log("old table:")
summary = JSON.stringify(make_node_summary(one_node_observations, node_meta), null, 1);
console.log(summary);
console.log("new table:")
summary2 = JSON.stringify(update_node_summary(make_node_summary(one_node_observations, node_meta), one_node_new_observations, new_node_meta), null, 1);
console.log(summary2);