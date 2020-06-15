import { describeBoth, testBoth } from './_testUtils';

interface TestModel {
    stringFieldName: string;
    integerFieldName: number;
}

describeBoth(
    {
        name: 'Insert',
        mappings: {
            properties: {
                stringFieldName: { type: 'keyword' },
                integerFieldName: { type: 'integer' },
            },
        },
    },
    () => {
        describe('insertOne', () => {
            testBoth('insertOne field types', async ({ db, collection }) => {
                await collection?.insertOne({
                    stringFieldName: 'test1',
                    integerFieldName: 123,
                });

                const results = await collection?.find<TestModel>({}).toArray();
                if (!results) {
                    throw new Error('not found');
                }
                expect(results.length).toBe(1);
                expect(results[0].stringFieldName).toBe('test1');
                expect(results[0].integerFieldName).toBe(123);
            });
        });
    },
);
