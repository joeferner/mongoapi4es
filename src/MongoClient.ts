import { Client, ClientOptions } from '@elastic/elasticsearch';
import { Collection } from './Collection';
import Debug from 'debug';

const debug = Debug('klm:mongo:client');

export class MongoClient {
    private _client: Client | undefined;
    private clientOptions: ClientOptions | undefined;

    constructor(clientOptions?: ClientOptions) {
        this.clientOptions = clientOptions;
    }

    async connect(clientOptions?: ClientOptions): Promise<void> {
        this.clientOptions = clientOptions || this.clientOptions;
        debug('connecting');
        this._client = new Client(this.clientOptions);
        const info = await this._client.info();
        debug('elasticsearch %O', info);
    }

    collection(collectionName: string): Collection {
        return new Collection(this, collectionName);
    }

    get client(): Client {
        if (!this._client) {
            throw new Error('not connected');
        }
        return this._client;
    }
}
