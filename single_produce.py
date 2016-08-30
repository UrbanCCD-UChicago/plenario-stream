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
    c = make_client()
    count = 0
    messages = []
    while True:
        message = ('{"node_id": "000","node_config": "23f","datetime": "'+datetime.utcnow().isoformat().split('+')[0]+'",' \
                          '"sensor": "TMP112","data": {"Temperature": '+str(random.uniform(60,90))+'}}')
        count += 1
	print message
        send_data(c, message.encode('ascii'))
	# time.sleep(.1)
