import {describeBoth, testBoth} from "./_testUtils";

interface TestModel {
    stringFieldName: string;
}

describeBoth(
    {
        name: 'Find',
        mappings: {
            properties: {
                stringFieldName: {type: 'keyword'}
            }
        }
    },
    () => {
        describe('findOne', () => {
            testBoth('no results', async ({db, collection}) => {
                const results = await collection?.findOne<TestModel>(
                    {
                        stringFieldName: 'does not exist'
                    }
                );
                expect(results).toBe(null);
            });

            testBoth('matching string', async ({db, collection}) => {
                await collection?.insertOne({
                    stringFieldName: 'test1'
                });
                await collection?.insertOne({
                    stringFieldName: 'test2'
                });

                const results = await collection?.findOne<TestModel>(
                    {
                        stringFieldName: 'test1'
                    }
                );
                if (!results) {
                    throw new Error('not found');
                }
                expect(results.stringFieldName).toBe('test1');
            });

            testBoth('sort', async ({db, collection}) => {
                await collection?.insertOne({
                    stringFieldName: 'test1'
                });
                await collection?.insertOne({
                    stringFieldName: 'test2'
                });

                const results = await collection?.find<TestModel>({})
                    .sort({
                        stringFieldName: -1
                    })
                    .limit(1)
                    .toArray();
                if (!results) {
                    throw new Error('not found');
                }
                expect(results.length).toBe(1);
                expect(results[0].stringFieldName).toBe('test2');
            });
        });
    }
);
