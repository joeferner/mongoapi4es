import { CursorResult } from './types';

export abstract class Cursor<T> {
    protected _limit?: number;
    protected _skip?: number;
    protected _sortKeyOrList?: string | object[] | object;
    protected _sortDirection?: number | undefined;
    protected _projection?: object;

    limit(value: number): Cursor<T> {
        this._limit = value;
        return this;
    }

    skip(value: number): Cursor<T> {
        this._skip = value;
        return this;
    }

    /** http://mongodb.github.io/node-mongodb-native/3.1/api/Cursor.html#toArray */
    async toArray(): Promise<T[]> {
        try {
            const results: T[] = [];
            while (await this.hasNext()) {
                const doc = await this.next();
                if (doc) {
                    results.push(doc);
                }
            }
            return results;
        } finally {
            await this.close();
        }
    }

    /** http://mongodb.github.io/node-mongodb-native/3.1/api/Cursor.html#hasNext */
    abstract hasNext(): Promise<boolean>;

    /** http://mongodb.github.io/node-mongodb-native/3.1/api/Cursor.html#next */
    abstract next(): Promise<T | null>;

    /** http://mongodb.github.io/node-mongodb-native/3.1/api/Cursor.html#close */
    abstract close(): Promise<CursorResult>;

    /** http://mongodb.github.io/node-mongodb-native/3.1/api/Cursor.html#sort */
    sort(keyOrList: string | object[] | object, direction?: number): Cursor<T> {
        this._sortKeyOrList = keyOrList;
        this._sortDirection = direction;
        return this;
    }

    /** http://mongodb.github.io/node-mongodb-native/3.1/api/Cursor.html#project */
    project(value: object): Cursor<T> {
        this._projection = value;
        return this;
    }
}
