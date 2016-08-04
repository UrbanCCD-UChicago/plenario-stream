from os import environ
import boto3
import boto3.dynamodb.types
import time
from decimal import Decimal

import datetime
import dateutil
import random


# converts floats to Decimal type to avoid dynamodb type errors
class _TypeSerializer(boto3.dynamodb.types.TypeSerializer):
    def serialize(self, value):
        if isinstance(value, float):
            value = Decimal(repr(value))
        dynamodb_type = self._get_dynamodb_type(value)
        serializer = getattr(self, '_serialize_%s' % dynamodb_type.lower())
        return {dynamodb_type: serializer(value)}


def make_client():
    """
    Connects to AWS to construct a Dynamodb client.
    :return: boto3 Dynamodb client
    """

    PROD_ID = environ.get('PROD_ID')
    PROD_KEY = environ.get('PROD_KEY')
    assert PROD_ID and PROD_KEY

    return boto3.client(
        'dynamodb',
        aws_access_key_id=PROD_ID,
        aws_secret_access_key=PROD_KEY
    )


def await_active_table(client, table_name):
    response = client.describe_table(TableName=table_name)['Table']['TableStatus']
    print table_name + ' table = ' + response
    while response != 'ACTIVE':
        time.sleep(10)
        response = client.describe_table(TableName=table_name)['Table']['TableStatus']
        print table_name + ' table = ' + response


def await_active_GSI(client, table_name, GSI_name):
    for i in range(0, min(5, len(client.describe_table(TableName=table_name)['Table']['GlobalSecondaryIndexes']))):
        if client.describe_table(TableName=table_name)['Table']['GlobalSecondaryIndexes'][i].get(
                'IndexName') == GSI_name:
            GSI_key = i
    response = client.describe_table(TableName=table_name)['Table']['GlobalSecondaryIndexes'][GSI_key]['IndexStatus']
    print GSI_name + ' index = ' + response
    while response != 'ACTIVE':
        time.sleep(10)
        response = client.describe_table(TableName=table_name)['Table']['GlobalSecondaryIndexes'][GSI_key][
            'IndexStatus']
        print GSI_name + ' index = ' + response


def create_network_table(client, network_name):
    """
    Creates network-level table storing raw observations.
    """

    response = client.create_table(
        AttributeDefinitions=[
            {
                'AttributeName': 'id',
                'AttributeType': 'S'
            },
            {
                'AttributeName': 'time',
                'AttributeType': 'S'
            }
        ],
        TableName=network_name,
        KeySchema=[
            {
                'AttributeName': 'id',
                'KeyType': 'HASH'
            },
            {
                'AttributeName': 'time',
                'KeyType': 'RANGE'
            }
        ],
        ProvisionedThroughput={
            'ReadCapacityUnits': 50,
            'WriteCapacityUnits': 50
        }
    )


def create_feature_table(client, network_name, feature):
    """
    Creates feature of interest table storing feature-specific results.
    """

    response = client.create_table(
        AttributeDefinitions=[
            {
                'AttributeName': 'id',
                'AttributeType': 'S'
            },
            {
                'AttributeName': 'time',
                'AttributeType': 'S'
            },
        ],
        TableName=network_name + '-' + feature,
        KeySchema=[
            {
                'AttributeName': 'id',
                'KeyType': 'HASH'
            },
            {
                'AttributeName': 'time',
                'KeyType': 'RANGE'
            }
        ],
        ProvisionedThroughput={
            'ReadCapacityUnits': 1,
            'WriteCapacityUnits': 1
        }
    )


def input_defining_observation(client, network_name, observation):
    """
    Use for first observation to set up feature of interest tables and secondary indexes

    Inputs observation as a map into network table and as at most 5 indexed properties into feature of interest tables.
    Creates feature of interest tables if they do not exist.
    Creates up to five global secondary indexes if they do not exist.
    """
    serializer = _TypeSerializer()

    # Input observation as a map into network table
    await_active_table(client, network_name)
    response = client.put_item(
        TableName=network_name,
        Item={'id': {'S': observation['id']},
              'time': {'S': observation['time']},
              'results': serializer.serialize(observation['results'])
              }
    )

    for i in range(0, len(observation['results'])):
        feature = observation['results'].keys()[i]

        # create new feature tables if they do not exist
        try:
            test_response = client.describe_table(
                TableName=network_name + '-' + feature)  # check to see if table exists
        except:  # ResourceNotFoundException
            create_feature_table(client, network_name, feature)
            await_active_table(client, network_name + '-' + feature)

        # create new global secondary indexes for each feature table if they do not exist
        current_GSI = []
        try:  # if there are no previous GSIs, no 'GlobalSecondaryIndexes' field exists in describe_table
            for j in range(0, len(
                    client.describe_table(TableName=network_name + '-' + feature)['Table']['GlobalSecondaryIndexes'])):
                current_GSI.append(
                    client.describe_table(TableName=network_name + '-' + feature)['Table']['GlobalSecondaryIndexes'][j][
                        'IndexName'])
        except KeyError:
            pass
        for k in range(0, len(observation.get('results').get(feature))):
            property = observation.get('results').get(feature).keys()[k]
            if network_name + '-' + feature + '-' + property not in current_GSI and len(current_GSI) < 5:
                if isinstance(observation.get('results').get(feature).get(property),
                              float):  # avoiding float error in _get_dynamodb_type
                    property_type = 'N'
                else:
                    property_type = serializer._get_dynamodb_type(observation.get('results').get(feature).get(property))
                client.update_table(
                    AttributeDefinitions=[
                        {
                            'AttributeName': property,
                            'AttributeType': property_type
                        },
                    ],
                    TableName=network_name + '-' + feature,
                    GlobalSecondaryIndexUpdates=[
                        {
                            'Create': {
                                'IndexName': network_name + '-' + feature + '-' + property,
                                'KeySchema': [
                                    {
                                        'AttributeName': property,
                                        'KeyType': 'HASH'
                                    },
                                ],
                                'Projection': {
                                    'ProjectionType': 'KEYS_ONLY',
                                },
                                'ProvisionedThroughput': {
                                    'ReadCapacityUnits': 1,
                                    'WriteCapacityUnits': 1
                                }
                            },
                        },
                    ],
                )
                current_GSI.append(property)
                await_active_GSI(client, network_name + '-' + feature, network_name + '-' + feature + '-' + property)

        # format observation to be added to feature tables
        item = {'id': {'S': observation['id']},
                'time': {'S': observation['time']}}
        for j in observation.get('results').get(feature).keys():
            item[j] = {}
            item[j].update(serializer.serialize(observation.get('results').get(feature).get(j)))

        # input observation into feature of interest table
        await_active_table(client, network_name + '-' + feature)
        response = client.put_item(
            TableName=network_name + '-' + feature,
            Item=item
        )

def input_observation(client, network_name, observation):
    """
    Inputs observation as a map into network table and as at most 5 indexed properties into feature of interest tables.
    Throws dynamodb ResourceNotFoundException if feature of interest tables do not exist.
    Will not add global secondary indexes.
    """
    serializer = _TypeSerializer()

    # Input observation as a map into network table
    response = client.put_item(
        TableName=network_name,
        Item={'id': {'S': observation['id']},
              'time': {'S': observation['time']},
              'results': serializer.serialize(observation['results'])
              }
    )

    for i in range(0, len(observation['results'])):
        feature = observation['results'].keys()[i]

        # format observation to be added to feature tables
        item = {'id': {'S': observation['id']},
                'time': {'S': observation['time']}}
        for j in observation.get('results').get(feature).keys():
            item[j] = {}
            item[j].update(serializer.serialize(observation.get('results').get(feature).get(j)))

        # input observation into feature of interest table
        response = client.put_item(
            TableName=network_name + '-' + feature,
            Item=item
        )

# Test setup
c = make_client()
# create_network_table(c, 'ArrayOfThings')
# input_defining_observation(c, 'ArrayOfThings', {'id': 'ArrayOfThings1',
#                                                 'time': datetime.datetime.now().isoformat(),
#                                                 'version': 7,
#                                                 'results': {
#                                                     'temperature': {
#                                                         'temperature': 89
#                                                     },
#                                                     'numPeople': {
#                                                         'numPeople': 14,
#                                                         'marginOfError': 2
#                                                     },
#                                                 }
#                                                 }
#                            )
#
# for i in range(0, 100):
observation = {'id': 'ArrayOfThings'+str(random.randrange(0,30)),
               'time': (datetime.datetime.now() + datetime.timedelta(days=random.randrange(0,30))).isoformat(),
               'version': random.randrange(3,8),
               'results': {
                   'temperature': {
                       'temperature': random.randrange(60,100)
                   },
                   'numPeople': {
                       'numPeople': random.randrange(4,30),
                       'marginOfError': random.randrange(1,5)
                   },
               }
               }
input_observation(c, 'ArrayOfThings', observation)
