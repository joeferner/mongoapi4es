import {FilterQuery} from './types';

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

            if (key.startsWith('$')) {
                throw new Error(`not implemented: query with $ prefix fields: ${key}`);
            }

            // range <, >, etc
            if (Object.keys(value).length === 1 && value.$lt) {
                mustQueries.push({
                    range: {
                        [key]: {
                            lt: value.$lt,
                        },
                    },
                });
                continue;
            }

            // term
            if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
                throw new Error(
                    `not implemented: non-string/non-number/non-boolean type: ${typeof value}: ${JSON.stringify(
                        value,
                        null,
                        2,
                    )}`,
                );
            }
            mustQueries.push({
                term: {
                    [key]: {
                        value,
                    },
                },
            });
        }

        if (mustQueries.length === 0) {
            return {
                match_all: {}
            };
        }

        return {
            bool: {
                must: mustQueries,
            },
        };
    }
}
