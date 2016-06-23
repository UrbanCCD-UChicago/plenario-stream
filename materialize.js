var make_node_summary = function(events, node_meta) {
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


var make_sensor_summary = function(ob_type, events) {
	var observations = [];
	var sum = 0;
	for(var i=0; i<events.length; i++){
		observations.push({'val': events[i][ob_type], 'time': (events[i])['time']});
		sum += events[i][ob_type];
	}
	return {
		'observations' : observations,
		'average' : sum/events.length
	}
}


var update_node_summary = function(table, events, node_meta) {
    var ob_types = node_meta['observation_types'];
    table['version'] = node_meta['version'];
    for(var i=0; i<ob_types.length; i++) {
        // deletes values outside one day window (unless no new data exists)
        try {
	    for (var j=table['sensors'][ob_types[i]]['observations'].length-1; j>=0; j--){
		if(table['sensors'][ob_types[i]]['observations'][j]['time'] < (Date.now() / 1000 - 86400)){
		    table['sensors'][ob_types[i]]['observations'].splice(j, 1);
		}
            }
        } catch (err) {
            console.log('no ' + ob_types[i] + ' observations within time window in previous table');
        }
        // adds new observations to existing sensors
        if (table['sensors'][ob_types[i]] != undefined) {
            for (var j=0; j<events.length; j++) {
                table['sensors'][ob_types[i]]['observations'].push((make_sensor_summary(ob_types[i], events))['observations'][j]);
	    }
        // recalculate averages (iterative, not weighted, which would be more efficient)
	    var sum = 0;
            for(var j=0; j<table['sensors'][ob_types[i]]['observations'].length; j++){
                    sum += table['sensors'][ob_types[i]]['observations'][j]['val'];
            }    
            table['sensors'][ob_types[i]]['average'] = sum/(table['sensors'][ob_types[i]]['observations'].length);
	}
        // adds new observations to new sensors
        else {
            table['sensors'][ob_types[i]] = make_sensor_summary(ob_types[i], events);
        }
    }
    return table
}

exports.make_node_summary = make_node_summary;
exports.make_sensor_summary = make_sensor_summary;
exports.update_node_summary = update_node_summary;
