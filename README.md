
# What is mongoapi4es

`mongoapi4es` is an API that partially mimics the v3.6 MongoDB node API (https://mongodb.github.io/node-mongodb-native/3.6/api/)
but stores and queries all the data from Elasticsearch. This is meant as either an alterntive API to the Elasticsearch
API or as a transition from Mongo to Elasticsearch.

# Install

```bash
npm install mongoapi4es
```

# Getting Started

Other than the loads of missing features and APIs this API is meant to act as if you were using Mongo. The only
difference is how you initialize the client.

```javascript
import { MongoClient as EsMongoClient } from './MongoClient';

// create a client and connect to Elasticsearch
const client = new EsMongoClient({
    node: 'http://localhost:9200',
    mongoapi4es: {
        refreshOnUpdates: true, // true if you want all the changes to be immediately available for search with a performance impact
    },
});
await client.connect();

// get access to the Db api. Elasticsearch doesn't really have databases so the parameter is ignored.
const db = client.db('ignored');

// create an Elasticsearch index called "testCollection"
await db.createCollection('testCollection');

// upload a mapping to ElasticSearch
await client.esClient.indices.putMapping({
    index: 'testCollection',
    body: {
        properties: {
            myField: { type: 'keyword' }
        },
    }
});

// insert a document into "testCollection"
await db.collection('testCollection').insertOne({
    myField: 'Hello World'
});

// find the document you just inserted
const results = await db.collection('testCollection').findOne({
    myField: 'Hello World'
});
```

# Development

The unit tests use docker instances of Elasticsearch and MongoDB to verify compatibility.

```bash
cd test
docker-compose up
cd ..
npm run build:watch
npm run test:watch
```
