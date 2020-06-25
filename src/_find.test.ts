import { describeBoth, testBoth } from './_testUtils';
import { FilterCursor } from './FilterCursor';
import { ObjectId } from 'bson';
import { Collection as EsCollection } from './Collection';

interface TestModel {
    stringFieldName: string;
    integerFieldName: number;
}

describeBoth(
    {
        name: 'Find',
        mappings: {
            properties: {
                stringFieldName: { type: 'keyword' },
                integerFieldName: { type: 'integer' },
            },
        },
    },
    () => {
        describe('findOne', () => {
            testBoth('no results', async ({ db, collection }) => {
                await collection?.insertOne({
                    stringFieldName: 'test1',
                });

                const results = await collection?.findOne<TestModel>({
                    stringFieldName: 'does not exist',
                });
                expect(results).toBe(null);
            });

            testBoth('matching string', async ({ db, collection }) => {
                const startId = new ObjectId();
                await collection?.insertOne({
                    stringFieldName: 'test1',
                });
                await collection?.insertOne({
                    stringFieldName: 'test2',
                });

                const result = await collection?.findOne<TestModel>({
                    stringFieldName: 'test1',
                });
                if (!result) {
                    throw new Error('not found');
                }
                const endId = new ObjectId();
                expect(result.stringFieldName).toBe('test1');
                const id = (result as any)._id;
                expect(id.getTimestamp().getTime()).toBeGreaterThanOrEqual(startId.getTimestamp().getTime());
                expect(id.getTimestamp().getTime()).toBeLessThanOrEqual(endId.getTimestamp().getTime());
            });
        });

        describe('find', () => {
            testBoth('sort', async ({ db, collection }) => {
                await collection?.insertOne({
                    stringFieldName: 'test1',
                });
                await collection?.insertOne({
                    stringFieldName: 'test2',
                });

                const results = await collection
                    ?.find<TestModel>({})
                    .sort({
                        stringFieldName: -1,
                    })
                    .limit(1)
                    .toArray();
                if (!results) {
                    throw new Error('not found');
                }
                expect(results.length).toBe(1);
                expect(results[0].stringFieldName).toBe('test2');
            });

            testBoth('skip', async ({ db, collection }) => {
                await collection?.insertOne({
                    integerFieldName: 1,
                });
                await collection?.insertOne({
                    integerFieldName: 2,
                });

                const results = await collection
                    ?.find<TestModel>({})
                    .sort({
                        integerFieldName: 1,
                    })
                    .skip(1)
                    .toArray();
                if (!results) {
                    throw new Error('not found');
                }
                expect(results.length).toBe(1);
                expect(results[0].integerFieldName).toBe(2);
            });

            testBoth('skip and limit', async ({ db, collection }) => {
                await collection?.insertOne({
                    integerFieldName: 1,
                });
                await collection?.insertOne({
                    integerFieldName: 2,
                });
                await collection?.insertOne({
                    integerFieldName: 3,
                });

                const results = await collection
                    ?.find<TestModel>({})
                    .sort({
                        integerFieldName: 1,
                    })
                    .skip(1)
                    .limit(1)
                    .toArray();
                if (!results) {
                    throw new Error('not found');
                }
                expect(results.length).toBe(1);
                expect(results[0].integerFieldName).toBe(2);
            });

            testBoth('projection', async ({ db, collection }) => {
                await collection?.insertOne({
                    stringFieldName: 'test1',
                    integerFieldName: 123,
                });

                const results = await collection?.find<TestModel>({}, { projection: { stringFieldName: 1 } }).toArray();
                if (!results) {
                    throw new Error('not found');
                }
                expect(results.length).toBe(1);
                expect(results[0].stringFieldName).toBe('test1');
                expect(results[0].integerFieldName).toBe(undefined);
            });

            testBoth('paging', async ({ db, collection }) => {
                const documentCount = FilterCursor.DEFAULT_PAGE_SIZE * 2 + 1;
                for (let i = 0; i < documentCount; i++) {
                    await collection?.insertOne({
                        stringFieldName: `test${i}`,
                        integerFieldName: i,
                    });
                }

                const results = await collection
                    ?.find<TestModel>({})
                    .sort({
                        integerFieldName: 1,
                    })
                    .toArray();
                if (!results) {
                    throw new Error('not found');
                }
                expect(results.length).toBe(documentCount);
                for (let i = 0; i < documentCount; i++) {
                    expect(results[i].integerFieldName).toBe(i);
                }
            });
        });

        describe('comparison', () => {
            const createData = async (collection: any) => {
                await collection?.insertOne({
                    integerFieldName: 1,
                });
                await collection?.insertOne({
                    integerFieldName: 2,
                });
                await collection?.insertOne({
                    integerFieldName: 3,
                });
            };

            testBoth('lt', async ({ db, collection }) => {
                await createData(collection);
                const results = await collection
                    ?.find<TestModel>({
                        integerFieldName: { $lt: 2 },
                    })
                    .toArray();
                if (!results) {
                    throw new Error('not found');
                }
                expect(results.length).toBe(1);
                expect(results[0].integerFieldName).toBe(1);
            });

            testBoth('gt', async ({ db, collection }) => {
                await createData(collection);
                const results = await collection
                    ?.find<TestModel>({
                        integerFieldName: { $gt: 2 },
                    })
                    .toArray();
                if (!results) {
                    throw new Error('not found');
                }
                expect(results.length).toBe(1);
                expect(results[0].integerFieldName).toBe(3);
            });

            testBoth('lte', async ({ db, collection }) => {
                await createData(collection);
                const results = await collection
                    ?.find<TestModel>({
                        integerFieldName: { $lte: 2 },
                    })
                    .sort({
                        integerFieldName: 1,
                    })
                    .toArray();
                if (!results) {
                    throw new Error('not found');
                }
                expect(results.length).toBe(2);
                expect(results[0].integerFieldName).toBe(1);
                expect(results[1].integerFieldName).toBe(2);
            });

            testBoth('gte', async ({ db, collection }) => {
                await createData(collection);
                const results = await collection
                    ?.find<TestModel>({
                        integerFieldName: { $gte: 2 },
                    })
                    .sort({
                        integerFieldName: 1,
                    })
                    .toArray();
                if (!results) {
                    throw new Error('not found');
                }
                expect(results.length).toBe(2);
                expect(results[0].integerFieldName).toBe(2);
                expect(results[1].integerFieldName).toBe(3);
            });

            testBoth('eq', async ({ db, collection }) => {
                await createData(collection);
                const results = await collection
                    ?.find<TestModel>({
                        integerFieldName: { $eq: 2 },
                    })
                    .toArray();
                if (!results) {
                    throw new Error('not found');
                }
                expect(results.length).toBe(1);
                expect(results[0].integerFieldName).toBe(2);
            });

            testBoth('ne', async ({ db, collection }) => {
                await createData(collection);
                const results = await collection
                    ?.find<TestModel>({
                        integerFieldName: { $ne: 2 },
                    })
                    .sort({
                        integerFieldName: 1,
                    })
                    .toArray();
                if (!results) {
                    throw new Error('not found');
                }
                expect(results.length).toBe(2);
                expect(results[0].integerFieldName).toBe(1);
                expect(results[1].integerFieldName).toBe(3);
            });
        });

        describe('boolean', () => {
            testBoth('or', async ({ db, collection }) => {
                await collection?.insertOne({
                    stringFieldName: 'test1',
                });
                await collection?.insertOne({
                    stringFieldName: 'test2',
                });
                await collection?.insertOne({
                    stringFieldName: 'test3',
                });

                const results = await collection
                    ?.find<TestModel>({
                        $or: [{ stringFieldName: 'test1' }, { stringFieldName: 'test2' }],
                    })
                    .sort({
                        stringFieldName: 1,
                    })
                    .toArray();
                if (!results) {
                    throw new Error('not found');
                }
                expect(results.length).toBe(2);
                expect(results[0].stringFieldName).toBe('test1');
                expect(results[1].stringFieldName).toBe('test2');
            });

            testBoth('and', async ({ db, collection }) => {
                await collection?.insertOne({
                    stringFieldName: 'test1',
                    integerFieldName: 1,
                });
                await collection?.insertOne({
                    stringFieldName: 'test2',
                    integerFieldName: 1,
                });
                await collection?.insertOne({
                    stringFieldName: 'test1',
                    integerFieldName: 2,
                });

                const results = await collection
                    ?.find<TestModel>({
                        $and: [{ stringFieldName: 'test1' }, { integerFieldName: 1 }],
                    })
                    .toArray();
                if (!results) {
                    throw new Error('not found');
                }
                expect(results.length).toBe(1);
                expect(results[0].stringFieldName).toBe('test1');
                expect(results[0].integerFieldName).toBe(1);
            });
        });

        describe('not', () => {
            testBoth('not', async ({ db, collection }) => {
                await collection?.insertOne({
                    stringFieldName: 'test1',
                });
                await collection?.insertOne({
                    stringFieldName: 'test2',
                });

                const results = await collection
                    ?.find<TestModel>({
                        stringFieldName: { $not: { $eq: 'test1' } },
                    })
                    .toArray();
                if (!results) {
                    throw new Error('not found');
                }
                expect(results.length).toBe(1);
                expect(results[0].stringFieldName).toBe('test2');
            });
        });

        describe('exists', () => {
            testBoth('exists', async ({ db, collection }) => {
                await collection?.insertOne({
                    stringFieldName: 'test1',
                    integerFieldName: 1,
                });
                await collection?.insertOne({
                    stringFieldName: 'test2',
                });
                // TODO nulls are treated differently in Mongo but Elasticsearch doesn't store nulls in the index
                //      so filtering on them is not possible
                // await collection?.insertOne({
                //      stringFieldName: 'test3',
                //      integerFieldName: null,
                // });

                const results = await collection
                    ?.find<TestModel>({
                        integerFieldName: { $exists: true },
                    })
                    .sort({
                        stringFieldName: 1,
                    })
                    .toArray();
                if (!results) {
                    throw new Error('not found');
                }
                expect(results.length).toBe(1);
                expect(results[0].stringFieldName).toBe('test1');
            });
        });
    },
);
