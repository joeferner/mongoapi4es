import { Cursor } from './Cursor';
import { FilterCursor } from './FilterCursor';
import {
    CollectionInsertOneOptions,
    DefaultSchema,
    FilterQuery,
    FindOneOptions,
    InsertOneWriteOpResult,
    OptionalId,
    UpdateManyOptions,
    UpdateOneOptions,
    UpdateQuery,
    UpdateWriteOpResult,
    WithId,
} from './types';
import { QueryBuilder } from './QueryBuilder';
import Debug from 'debug';
import { Db } from './Db';
import { ObjectId } from 'bson';

const debug = Debug('mongoapi4es:Collection');

export class Collection<TSchema extends { [key: string]: any } = DefaultSchema> {
    private _db: Db;
    private _collectionName: string;

    constructor(db: Db, collectionName: string) {
        this._db = db;
        this._collectionName = collectionName;
    }

    async findOne<T = TSchema>(filter: FilterQuery<TSchema>, options?: FindOneOptions): Promise<T | null> {
        return this.find(filter, options)
            .limit(1)
            .toArray()
            .then((arr) => {
                return ((arr[0] as any) as T) || null;
            });
    }

    find<T>(filter: FilterQuery<T>, options?: FindOneOptions): Cursor<T> {
        return new FilterCursor<T>(this, filter, options);
    }

    /** http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#updateMany */
    async updateMany<T>(
        filter: FilterQuery<T>,
        update: UpdateQuery<T> | Partial<T>,
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
                if (typeof value.getTime === 'function') {
                    value = `ZonedDateTime.ofInstant(Instant.ofEpochMilli(${value.getTime()}L), ZoneId.of('Z'))`;
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
        try {
            const result = await this._db.client.esClient.updateByQuery({
                refresh: this._db.client.clientOptions.mongoapi4es?.refreshOnUpdates,
                index: this.collectionName,
                body,
            });
        } catch (err) {
            debug('%s', JSON.stringify(err, null, 2));
            throw err;
        }
        return {};
    }

    /** http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#updateOne */
    async updateOne<T>(
        filter: FilterQuery<T>,
        update: UpdateQuery<T> | Partial<T>,
        options?: UpdateOneOptions,
    ): Promise<UpdateWriteOpResult> {
        return this.updateMany(filter, update, options);
    }

    async insertOne<T>(
        doc: OptionalId<T>,
        options?: CollectionInsertOneOptions,
    ): Promise<InsertOneWriteOpResult<WithId<T>>> {
        options = options || {};
        if (Object.keys(options).length > 0) {
            throw new Error('not implemented: insert with options');
        }

        const refresh = this._db.client.clientOptions.mongoapi4es?.refreshOnUpdates;
        const body: any = {
            ...doc,
        };
        let id;
        if ('_id' in body) {
            id = body._id;
            delete body._id;
        } else {
            id = new ObjectId().toHexString();
        }
        const result = await this._db.client.esClient.index({
            index: this._collectionName,
            id,
            body,
            refresh: refresh === undefined ? 'false' : refresh ? 'true' : 'false',
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

    get collectionName() {
        return this._collectionName;
    }

    /**
     * Not part of MongoDb API
     */
    get db(): Db {
        return this._db;
    }
}
