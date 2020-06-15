import { describeBoth, testBoth } from './_testUtils';

interface TestModel {
    stringFieldName: string;
    stringField2Name: string;
    integerFieldName: number;
}

describeBoth(
    {
        name: 'Update',
        mappings: {
            properties: {
                stringFieldName: { type: 'keyword' },
                stringField2Name: { type: 'keyword' },
                integerFieldName: { type: 'integer' },
            },
        },
    },
    () => {
        describe('updateMany', () => {
            testBoth('updateMany set', async ({ db, collection }) => {
                await collection?.insertOne({
                    stringFieldName: 'test1',
                    stringField2Name: 'test1',
                    integerFieldName: 123,
                });
                await collection?.insertOne({
                    stringFieldName: 'test1',
                    stringField2Name: 'test2',
                    integerFieldName: 234,
                });
                await collection?.insertOne({
                    stringFieldName: 'test2',
                    stringField2Name: 'test3',
                    integerFieldName: 345,
                });

                const updateResults = await collection?.updateMany<TestModel>(
                    {
                        stringFieldName: 'test1',
                    },
                    {
                        $set: {
                            integerFieldName: 111,
                        },
                    },
                );
                if (!updateResults) {
                    throw new Error('failed');
                }

                const findResults = await collection?.find<TestModel>({}).sort({ stringField2Name: 1 }).toArray();
                if (!findResults) {
                    throw new Error('not found');
                }
                expect(findResults.length).toBe(3);
                expect(findResults[0].stringField2Name).toBe('test1');
                expect(findResults[0].integerFieldName).toBe(111);
                expect(findResults[1].stringField2Name).toBe('test2');
                expect(findResults[1].integerFieldName).toBe(111);
                expect(findResults[2].stringField2Name).toBe('test3');
                expect(findResults[2].integerFieldName).toBe(345);
            });
        });
    },
);
