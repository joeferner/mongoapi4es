import { Cursor } from './Cursor';
import { FilterCursor } from './FilterCursor';
import {
    CollectionInsertOneOptions,
    FilterQuery,
    FindOneOptions,
    InsertOneWriteOpResult,
    OptionalId,
    UpdateManyOptions,
    UpdateQuery,
    UpdateWriteOpResult,
    WithId,
} from './types';
import { MongoClient } from './MongoClient';
import { QueryBuilder } from './QueryBuilder';
import Debug from 'debug';

const debug = Debug('klm:mongo:Collection');

export class Collection {
    private _client: MongoClient;
    private _collectionName: string;

    constructor(client: MongoClient, collectionName: string) {
        this._client = client;
        this._collectionName = collectionName;
    }

    async findOne<T>(filter: FilterQuery<Partial<T>>, options?: FindOneOptions<Partial<T>>): Promise<T> {
        return this.find(filter, options)
            .limit(1)
            .toArray()
            .then((arr) => {
                return arr[0] as T;
            });
    }

    find<T>(filter: FilterQuery<T>, options?: FindOneOptions<T>): Cursor<T> {
        return new FilterCursor<T>(this, filter, options);
    }

    /** http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#updateMany */
    async updateMany<TSchema>(
        filter: FilterQuery<TSchema>,
        update: UpdateQuery<TSchema> | Partial<TSchema>,
        options?: UpdateManyOptions,
    ): Promise<UpdateWriteOpResult> {
        options = options || {};
        if (Object.keys(options).length > 0) {
            throw new Error('not implemented: insert with options');
        }

        let source = '';
        if ((update as any).$set) {
            const set = (update as any).$set;
            for (const key of Object.keys(set)) {
                let value = set[key];
                if (typeof value === 'string' || value instanceof String) {
                    value = `"${value.replace(/"/g, '\\"')}"`;
                }
                source += `ctx._source["${key}"] = ${value};\n`;
            }
        } else {
            throw new Error('not implemented: update ! $set');
        }

        const body = {
            query: QueryBuilder.buildQuery(filter),
            script: {
                lang: 'painless',
                source,
            },
        };
        debug('%s', JSON.stringify(body, null, 2));
        const result = await this.client.client.updateByQuery({
            index: this.collectionName,
            body,
        });
        return {};
    }

    async insertOne<TSchema>(
        docs: OptionalId<TSchema>,
        options?: CollectionInsertOneOptions,
    ): Promise<InsertOneWriteOpResult<WithId<TSchema>>> {
        options = options || {};
        if (Object.keys(options).length > 0) {
            throw new Error('not implemented: insert with options');
        }

        const result = await this._client.client.index({
            index: this._collectionName,
            body: docs,
        });
        return {
            insertedCount: 1,
            insertedId: result.body._id,
            result: {
                ok: 1,
                n: 1,
            },
        };
    }

    get client(): MongoClient {
        return this._client;
    }

    get collectionName() {
        return this._collectionName;
    }
}
