import json
from socketIO_client import SocketIO

socketIO = SocketIO("streaming.plenar.io", params={
    'sensor_network': 'ArrayOfThings',
    'features_of_interest': 'gasConcentration',
    'nodes': ['00A']})

def on_data(data):
    print json.dumps(data)

def on_error(err):
    print json.dumps(err)

socketIO.on('data', on_data)
socketIO.on('internal_error', on_error)
socketIO.wait()