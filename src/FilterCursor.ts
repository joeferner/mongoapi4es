import { Cursor } from './Cursor';
import { CursorResult, FilterQuery, FindOneOptions } from './types';
import { QueryResults } from './QueryResults';
import Debug from 'debug';
import { QueryBuilder } from './QueryBuilder';
import { Collection } from './Collection';
import { ObjectId } from 'bson';

const debug = Debug('mongoapi4es:FilterCursor');

export class FilterCursor<T> extends Cursor<T> {
    static readonly DEFAULT_PAGE_SIZE: number = 20;
    private readonly _collection: Collection<T>;
    private readonly _filter: FilterQuery<T>;
    private readonly _options: FindOneOptions;
    private _results: QueryResults<T> | undefined;
    private _resultsIndex: number | undefined;
    private _resultsOffset: number;
    private _pageSize: number;

    constructor(collection: Collection<T>, filter: FilterQuery<T>, options?: FindOneOptions) {
        super();
        this._pageSize = options?.esPageSize || FilterCursor.DEFAULT_PAGE_SIZE;
        this._resultsOffset = 0;
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
            this._results = await this.query();
        }
        if (!this._results) {
            throw new Error('invalid state');
        }
        if (this._resultsIndex === undefined) {
            this._resultsIndex = 0;
        }
        if (this._resultsIndex < this._results.hits.length) {
            return true;
        }
        if (this._limit !== undefined && this._resultsIndex + this._resultsOffset >= this._limit) {
            return false;
        }
        if ((this._skip || 0) + this._resultsIndex + this._resultsOffset >= this._results.total.value) {
            return false;
        }

        // setup and load next batch of results
        this._resultsOffset += this._results.hits.length;
        this._resultsIndex = 0;
        this._results = undefined;
        return this.hasNext();
    }

    async next(): Promise<T | null> {
        if (!(await this.hasNext())) {
            return null;
        }
        if (!this._results || this._resultsIndex === undefined) {
            throw new Error('invalid state, hasNext returned true but no results or currentIndex set');
        }
        const hit = this._results.hits[this._resultsIndex];
        if (hit) {
            this._resultsIndex++;
            const id = ObjectId.isValid(hit._id) ? new ObjectId(hit._id) : hit._id;
            return {
                _id: id,
                ...hit._source,
            };
        }
        return null;
    }

    private async query(): Promise<QueryResults<T>> {
        let projection = this._projection;

        for (const optionKey of Object.keys(this._options)) {
            const optionValue = (this._options as any)[optionKey];
            if (optionKey === 'projection') {
                if (projection) {
                    throw new Error('not implemented: project and projection options');
                }
                projection = optionValue;
            } else {
                throw new Error('not implemented: query with options');
            }
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
                sort: [{ [key]: { order: dir } }],
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
            query: QueryBuilder.buildQuery(this._filter),
            ...sort,
            ...sourceFilter,
            from: (this._skip || 0) + this._resultsOffset,
            size: Math.min(
                this._pageSize,
                (this._limit === undefined ? Number.MAX_SAFE_INTEGER : this._limit) - this._resultsOffset,
            ),
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
