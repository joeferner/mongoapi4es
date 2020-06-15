import { Client, ClientOptions } from '@elastic/elasticsearch';
import Debug from 'debug';
import { Db } from './Db';

const debug = Debug('mongoapi4es:client');

export interface Mongoapi4esOptions extends ClientOptions {
    mongoapi4es?: {
        refreshOnUpdates?: boolean;
    };
}

export class MongoClient {
    private _esClient: Client | undefined;
    private _clientOptions: Mongoapi4esOptions | undefined;

    constructor(clientOptions?: Mongoapi4esOptions) {
        this._clientOptions = clientOptions;
    }

    async connect(clientOptions?: Mongoapi4esOptions): Promise<void> {
        this._clientOptions = clientOptions || this._clientOptions;
        debug('connecting');
        this._esClient = new Client(this._clientOptions);
        const info = await this._esClient.info();
        debug('elasticsearch %O', info);
    }

    async close(): Promise<void> {
        await this._esClient?.close();
    }

    db(dbName: string): Db {
        return new Db(this, dbName);
    }

    get esClient(): Client {
        if (!this._esClient) {
            throw new Error('not connected');
        }
        return this._esClient;
    }

    get clientOptions(): Mongoapi4esOptions {
        if (!this._clientOptions) {
            throw new Error('not connected');
        }
        return this._clientOptions;
    }
}
