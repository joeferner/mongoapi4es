import {Cursor} from './Cursor';
import {CursorResult, FilterQuery, FindOneOptions} from './types';
import {QueryResults} from './QueryResults';
import Debug from 'debug';
import {QueryBuilder} from './QueryBuilder';
import {Collection} from "./Collection";

const debug = Debug('mongoapi4es:FilterCursor');

export class FilterCursor<T> extends Cursor<T> {
    private readonly _collection: Collection<T>;
    private readonly _filter: FilterQuery<T>;
    private readonly _options: FindOneOptions;
    private _results: QueryResults<T> | undefined;
    private _currentIndex: number | undefined;

    constructor(collection: Collection<T>, filter: FilterQuery<T>, options?: FindOneOptions) {
        super();
        this._collection = collection;
        this._filter = filter;
        this._options = options || {};
    }

    close(): Promise<CursorResult> {
        // TODO handle long running cursors
        return Promise.resolve(null);
    }

    async toArray(): Promise<T[]> {
        return super.toArray().then((arr) => {
            if (this._results) {
                (arr as any).total = this._results.total;
            }
            return arr;
        });
    }

    async hasNext(): Promise<boolean> {
        if (!this._results) {
            this._results = await this.query(this._filter, this._options);
        }
        if (!this._results) {
            throw new Error('invalid state');
        }
        if (this._currentIndex === undefined) {
            this._currentIndex = 0;
        }
        return this._currentIndex < this._results.hits.length;
    }

    async next(): Promise<T | null> {
        if (!this._results) {
            this._results = await this.query(this._filter, this._options);
        }
        if (!this._results) {
            throw new Error('invalid state');
        }
        if (this._currentIndex === undefined) {
            this._currentIndex = 0;
        }
        const hit = this._results.hits[this._currentIndex];
        if (hit) {
            this._currentIndex++;
            return hit._source;
        }
        return null;
    }

    private async query(filter: FilterQuery<any>, options: FindOneOptions): Promise<QueryResults<T>> {
        let projection = this._projection;

        for (const optionKey of Object.keys(options)) {
            const optionValue = (options as any)[optionKey];
            if (optionKey === 'projection') {
                if (projection) {
                    throw new Error('not implemented: project and projection options');
                }
                projection = optionValue;
            } else {
                throw new Error('not implemented: query with options');
            }
        }
        if (this._limit === undefined) {
            throw new Error('not implemented: limit === undefined');
        }

        let sort = {};
        if (this._sortKeyOrList || this._sortDirection) {
            if (this._sortDirection) {
                throw new Error('not implemented: sort');
            }
            if (typeof this._sortKeyOrList === 'string') {
                throw new Error('not implemented: sortKeyOrList string');
            }
            if (Array.isArray(this._sortKeyOrList)) {
                throw new Error('not implemented: sortKeyOrList array');
            }
            if (Object.keys(this._sortKeyOrList as object).length !== 1) {
                throw new Error('not implemented: sortKeyOrList multiple keys');
            }
            const key = Object.keys(this._sortKeyOrList as object)[0];
            const value = (this._sortKeyOrList as any)[key];
            let dir;
            if (value === -1) {
                dir = 'desc';
            } else if (value === 1) {
                dir = 'asc';
            } else {
                throw new Error(`invalid sort direction: ${value}`);
            }
            sort = {
                sort: [{[key]: {order: dir}}],
            };
        }

        let sourceFilter = {};
        if (projection) {
            const includes: string[] = [];
            const excludes: string[] = [];
            for (const key of Object.keys(projection)) {
                const value = (projection as any)[key];
                if (value) {
                    includes.push(key);
                } else {
                    excludes.push(key);
                }
            }
            sourceFilter = {
                _source: {
                    includes,
                    excludes,
                },
            };
        }

        const body = {
            query: QueryBuilder.buildQuery(filter),
            ...sort,
            ...sourceFilter,
            from: this._skip || 0,
            size: this._limit,
        };
        debug('%s', JSON.stringify(body, null, 2));
        try {
            const result = await this._collection.db.client.esClient.search({
                index: this._collection.collectionName,
                body,
            });
            debug('%s', JSON.stringify(result, null, 2));
            return result.body.hits;
        } catch (err) {
            debug('%O', err.stack);
            throw err;
        }
    }
}
