"""Sends simple strings to Kinesis test stream."""

import sys
from os import environ
import boto3
import time
import random

def make_client():
    """
    Connects to AWS to construct a Kinesis client.
    :return: boto3 Kinesis client
    """

    PROD_ID = environ.get('PROD_ID')
    PROD_KEY = environ.get('PROD_KEY')
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
        count += 1        
	for i in range(1,6):
	    temperature = str(random.uniform(70,90))
	    pressure = str(random.uniform(28,32))
	    message = '{"id": "foo'+str(i)+'","version": 1,"time": '+str(1565572100+count*15)+',"temperature": '+temperature+',"pressure": '+pressure+'}'
            c = make_client()
            # print message
	    send_data(c, message.encode('ascii'))
	time.sleep(15)
