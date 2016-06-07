"""Sends simple strings to Kinesis test stream."""

import sys
from os import environ
import boto3


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
    message = sys.argv[1]
    c = make_client()
    send_data(c, message.encode('ascii'))
