import unittest
from summarizer.materialize import create_summary


class MaterializeTests(unittest.TestCase):

    # Represents 'data' attributes of incoming records
    # marshalled into dictionaries
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
            'time': 1465572173,
            'temperature': 91.1,
            'pressure': 28.1
        }
    ]

    node_meta = {
        'id': 'foo',
        'version': 1,
        'observation_types': ['temperature', 'pressure']
    }

    node_table = {
        'version': 1,
        'sensors': {
            'temperature': {
                'observations': [{'val': 77.2, 'time': 1465570173},
                                 {'val': 85.2, 'time': 1465571173},
                                 {'val': 91.1, 'time': 1465572173}],
                'average': 84.5
            },
            'pressure': {
                'observations': [{'val': 29.9, 'time': 1465570173},
                                 {'val': 32, 'time': 1465571173},
                                 {'val': 28.1, 'time': 1465572173}],
                'average': 30.0
            }
        }
    }

    incoming_observation = {
        'id': 'foo',
        'version': 1,
        'timestamp': 1465573173,
        'temperature': 72,
        'pressure': 25
    }

    def test_create_summary(self):
        observed_summary = create_summary(self.one_node_observations,
                                          self.node_meta)
        self.assertDictEqual(observed_summary, self.node_table)

    def test_update_summary(self):
        pass

    def test_summary_out_of_time_window(self):
        pass
