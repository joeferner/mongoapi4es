import { FilterQuery } from './types';

export class QueryBuilder {
    static buildQuery(filter: FilterQuery<any>): any {
        const mustQueries = [];
        for (const key of Object.keys(filter)) {
            const value = (filter as any)[key];

            if (key === '$text') {
                if (Object.keys(value).length === 1 && '$search' in value) {
                    mustQueries.push({
                        query_string: {
                            query: value.$search,
                        },
                    });
                    continue;
                }
            }

            if (key === '$or') {
                if (!Array.isArray(value)) {
                    throw new Error('$or must be an array');
                }
                mustQueries.push({
                    bool: {
                        should: value.map((v) => this.buildQuery(v)),
                        minimum_should_match: 1,
                    },
                });
                continue;
            }

            if (key === '$and') {
                if (!Array.isArray(value)) {
                    throw new Error('$and must be an array');
                }
                mustQueries.push({
                    bool: {
                        must: value.map((v) => this.buildQuery(v)),
                    },
                });
                continue;
            }

            if (key.startsWith('$')) {
                throw new Error(`not implemented: query with $ prefix fields: ${key}`);
            }

            // range <, >, etc
            if (Object.keys(value).length === 1 && (value.$lt || value.$gt || value.$lte || value.$gte)) {
                mustQueries.push({
                    range: {
                        [key]: {
                            [Object.keys(value)[0].substr(1)]: value.$lt || value.$gt || value.$lte || value.$gte,
                        },
                    },
                });
                continue;
            }

            if (Object.keys(value).length === 1 && value.$not) {
                const notQuery = value.$not;
                if (Object.keys(notQuery).length !== 1 && !notQuery.$eq) {
                    throw new Error('only $not $eq queries are supported');
                }
                mustQueries.push({
                    bool: {
                        must_not: {
                            term: {
                                [key]: notQuery.$eq,
                            },
                        },
                    },
                });
                continue;
            }

            // term
            mustQueries.push(this.buildTermQuery(key, value));
        }

        if (mustQueries.length === 0) {
            return {
                match_all: {},
            };
        }

        return {
            bool: {
                must: mustQueries,
            },
        };
    }

    private static buildTermQuery(key: string, value: any): any {
        if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
            throw new Error(
                `not implemented: non-string/non-number/non-boolean type: ${typeof value}: ${JSON.stringify(
                    value,
                    null,
                    2,
                )}`,
            );
        }
        return {
            term: {
                [key]: {
                    value,
                },
            },
        };
    }
}
