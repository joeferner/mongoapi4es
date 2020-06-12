import {MongoClient as EsMongoClient} from "./MongoClient";
import {MongoClient as MongoMongoClient} from "mongodb";
import {Collection as EsCollection} from "./Collection";
import {Db as EsDb} from "./Db";

interface CurrentTest {
    id: string;
    description: string;
    fullName: string;
    failedExpectations: {
        actual: string;
        error: Error;
        expected: string;
        matcherName: string;
        message: string;
        passed: boolean;
        stack: string;
    }[];
    passedExpectations: unknown[];
    pendingReason: string;
    testPath: string;
}

interface Jasmine {
    dbName?: string;
    currentTest?: CurrentTest;
    esClient?: EsMongoClient;
    mongoClient?: MongoMongoClient;
    collectionName?: string;
}

export interface TestBothArgs {
    client: EsMongoClient;
    db: EsDb;
    collectionName?: string;
    collection?: EsCollection;
}

export interface DescribeBothOptions {
    name: string;
    mappings?: any;
}

export function describeBoth(options: DescribeBothOptions, fn: () => void) {
    describe(options.name, () => {
        beforeAll(async () => {
            const esClient = new EsMongoClient({
                node: 'http://localhost:9200'
            });
            await esClient.connect();

            const mongoClient = new MongoMongoClient('mongodb://root:root@localhost:27017/admin');
            await mongoClient.connect();

            (jasmine as Jasmine).dbName = 'test';
            (jasmine as Jasmine).esClient = esClient;
            (jasmine as Jasmine).mongoClient = mongoClient;
        });

        afterAll(async () => {
            const esClient = (jasmine as Jasmine).esClient as EsMongoClient;
            if (esClient) {
                await esClient.close();
            }
        });

        beforeEach(async () => {
            const dbName = (jasmine as Jasmine).dbName;
            if (!dbName) {
                throw new Error('dbName missing')
            }
            const collectionName = `test-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            (jasmine as Jasmine).collectionName = collectionName;
            const currentTest = (jasmine as Jasmine).currentTest as CurrentTest;
            if (currentTest.fullName.endsWith('mongo')) {
                const mongoClient = (jasmine as Jasmine).mongoClient;
                if (!mongoClient) {
                    throw new Error('missing esClient');
                }
                await mongoClient.db(dbName).createCollection(collectionName);
            } else if (currentTest.fullName.endsWith('es')) {
                const esClient = (jasmine as Jasmine).esClient;
                if (!esClient) {
                    throw new Error('missing esClient');
                }
                await esClient.db(dbName).createCollection(collectionName);

                if (options.mappings) {
                    await esClient.esClient.indices.putMapping({
                        index: collectionName,
                        body: options.mappings
                    });
                }
            }
        });

        afterEach(async () => {
            const dbName = (jasmine as Jasmine).dbName;
            if (!dbName) {
                throw new Error('dbName missing')
            }
            const collectionName = (jasmine as Jasmine).collectionName;
            const currentTest = (jasmine as Jasmine).currentTest as CurrentTest;
            if (collectionName) {
                if (currentTest.fullName.endsWith('mongo')) {
                    const mongoClient = (jasmine as Jasmine).mongoClient;
                    if (!mongoClient) {
                        throw new Error('missing esClient');
                    }
                    await mongoClient.db(dbName).dropCollection(collectionName);
                } else if (currentTest.fullName.endsWith('es')) {
                    const esClient = (jasmine as Jasmine).esClient;
                    if (!esClient) {
                        throw new Error('missing esClient');
                    }
                    await esClient.db(dbName).dropCollection(collectionName);
                }
            }
        });

        fn();
    });
}

export function testBoth(name: string, fn: (args: TestBothArgs) => Promise<void>) {
    describe(name, () => {
        test('es', async () => {
            const dbName = (jasmine as Jasmine).dbName;
            if (!dbName) {
                throw new Error('dbName not specified');
            }
            const collectionName = (jasmine as Jasmine).collectionName;

            const esClient = (jasmine as Jasmine).esClient;
            if (!esClient) {
                throw new Error('missing esClient');
            }
            const db = esClient.db(dbName);
            await fn({
                client: esClient,
                db,
                collectionName,
                collection: collectionName ? db.collection(collectionName) : undefined
            });
        });

        test('mongo', async () => {
            const dbName = (jasmine as Jasmine).dbName;
            if (!dbName) {
                throw new Error('dbName not specified');
            }
            const collectionName = (jasmine as Jasmine).collectionName;

            const mongoClient = (jasmine as Jasmine).mongoClient;
            if (!mongoClient) {
                throw new Error('missing esClient');
            }
            const db = mongoClient.db(dbName);
            const collection = collectionName ? db.collection(collectionName) : undefined;
            await fn({
                client: (mongoClient as any) as EsMongoClient,
                db: (db as any) as EsDb,
                collectionName,
                collection: (collection as any) as EsCollection
            });
        });
    });
}