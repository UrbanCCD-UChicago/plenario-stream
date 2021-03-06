"""Sends simple strings to Kinesis test stream."""

import sys
from os import environ
import boto3

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

# Expected format:
#
# {"node_id": "00A",
#  "node_config": "011ab78",
#  "datetime": "2016-08-05T00:00:08.246000",
#  "sensor": "HTU21D",
#  "data": {
#      "temperature": 37.90,
#      "humidity": 27.48}}

if __name__ == '__main__':
    c = make_client()
    message = sys.argv[1]
    print "SENT: " + message
    send_data(c, message.encode('ascii'))

