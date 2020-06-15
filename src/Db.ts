import { MongoClient } from './MongoClient';
import { Collection } from './Collection';
import { DbCollectionOptions, DefaultSchema, MongoCallback } from './types';

export class Db {
    private _client: MongoClient;
    private _dbName: string;

    constructor(client: MongoClient, dbName: string) {
        this._client = client;
        this._dbName = dbName;
    }

    async createCollection(name: string): Promise<void> {
        await this.client.esClient.indices.create({
            index: name,
        });
    }

    async dropCollection(name: string): Promise<void> {
        await this.client.esClient.indices.delete({
            index: name,
        });
    }

    /**
     * http://mongodb.github.io/node-mongodb-native/3.1/api/Db.html#collection
     * collection<TSchema = DefaultSchema>(name: string, callback?: MongoCallback<Collection<TSchema>>): Collection<TSchema>;
     * collection<TSchema = DefaultSchema>(name: string, options: DbCollectionOptions, callback?: MongoCallback<Collection<TSchema>>): Collection<TSchema>;
     */
    collection<TSchema = DefaultSchema>(
        name: string,
        optionsOrCallback?: MongoCallback<Collection<TSchema>> | DbCollectionOptions,
        callback?: MongoCallback<Collection<TSchema>>,
    ): Collection<TSchema> {
        if (optionsOrCallback || callback) {
            throw new Error('not implemented');
        }
        return new Collection<TSchema>(this, name);
    }

    get client() {
        return this._client;
    }
}
