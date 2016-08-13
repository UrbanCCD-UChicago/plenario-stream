"""Sends simple strings to Kinesis test stream."""

import sys
from os import environ
import boto3
from datetime import datetime
import time
import random

def make_client():
    """
    Connects to AWS to construct a Kinesis client.
    :return: boto3 Kinesis client
    """

    PROD_ID = environ.get('AWS_ACCESS_KEY_ID')
    PROD_KEY = environ.get('AWS_SECRET_ACCESS_KEY')
    assert PROD_ID and PROD_KEY

    return boto3.client(
        'kinesis',
        aws_access_key_id=PROD_ID,
        aws_secret_access_key=PROD_KEY
    )


def send_data(client, data):
    """
    Send a chunk of binary data
    to the hardcoded stream named 'ObservationStream'
    at hardcoded partition 'arbitrary'.

    :param client: boto3 kinesis client
    :param data: binary data (no unicode strings please)
    :return:
    """
    params = {
        'StreamName': 'ObservationStream',
        'PartitionKey': 'arbitrary',
        'Data': data
    }
    client.put_record(**params)

if __name__ == '__main__':
    count = 0
    while True:
        for i in range(1,2):
            temperature = str(random.uniform(70,90))
            pressure = str(random.uniform(28,32))
            message1 = '{"node_id": "ArrayOfThings'+str(i)+'","datetime": "'+datetime.utcnow().isoformat().split('+')[0]+'",' \
                                                         '"sensor": "PRE450","data": '+str([random.randrange(0, 100)])+'}'
            message2 = '{"node_id": "ArrayOfThings'+str(i)+'","datetime": "'+datetime.utcnow().isoformat().split('+')[0]+'",' \
                                                         '"sensor": "TMP112","data": '+str([random.randrange(0, 100)])+'}'
            message3 = '{"node_id": "ArrayOfThings'+str(i)+'","datetime": "'+datetime.utcnow().isoformat().split('+')[0]+'",' \
                                                         '"sensor": "UBQ120","data": '+str([random.randrange(0, 100),random.randrange(0, 100),random.randrange(0, 100)])+'}'
            c = make_client()
            print message1
            print message2
            print message3
            send_data(c, message1.encode('ascii'))
            send_data(c, message2.encode('ascii'))
            send_data(c, message3.encode('ascii'))
        time.sleep(4)
