import json
from socketIO_client import SocketIO
import time
from threading import Thread

def on_data(data):
    print json.dumps(data)


def on_error(err):
    print json.dumps(err)


def open_client():
    socketIO = SocketIO("streaming.plenar.io")

    socketIO.on('data', on_data)
    socketIO.on('internal_error', on_error)
    socketIO.wait()

for i in range(0, 5):
    t = Thread(target=open_client)
    t.start()
    time.sleep(.2)
