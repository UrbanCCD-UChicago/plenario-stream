import operator


def create_summary(events, node_meta):
    ob_types = node_meta['observation_types']
    sensor_summaries = {ob_type: make_sensor_summary(ob_type, events)
                        for ob_type in ob_types}
    return {
        'version': node_meta['version'],
        'sensors': sensor_summaries
    }


def make_sensor_summary(ob_type, events):
    get = operator.itemgetter(ob_type)
    return {
        'observations': [{'val': event[ob_type], 'time': event['time']}
                         for event in events],
        'average': sum(map(get, events))/len(events)
    }
