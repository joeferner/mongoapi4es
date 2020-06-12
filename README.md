
# Development

The unit tests use docker instances of Elasticsearch and MongoDB to verify compatibility.

```
cd test
docker-compose up
cd ..
npm run build:watch
npm run test:watch
```
