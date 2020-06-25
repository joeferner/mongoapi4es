// see https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/mongodb/index.d.ts

/**
 * Creates a new MongoError
 * see {@link http://mongodb.github.io/node-mongodb-native/3.5/api/MongoError.html}
 */
export interface MongoError extends Error {
    /**
     * Checks the error to see if it has an error label
     */
    hasErrorLabel(label: string): boolean;

    code?: number;
    /**
     * While not documented, the 'errmsg' prop is AFAIK the only way to find out
     * which unique index caused a duplicate key error. When you have multiple
     * unique indexes on a collection, knowing which index caused a duplicate
     * key error enables you to send better (more precise) error messages to the
     * client/user (eg. "Email address must be unique" instead of "Both email
     * address and username must be unique") - which caters for a better (app)
     * user experience.
     *
     * Details: https://github.com/Automattic/mongoose/issues/2129 (issue for
     * mongoose, but the same applies for the native mongodb driver)
     *
     * Note that in mongoose (the link above) the prop in question is called
     * 'message' while in mongodb it is called 'errmsg'. This can be seen in
     * multiple places in the source code, for example here:
     * https://github.com/mongodb/node-mongodb-native/blob/a12aa15ac3eaae3ad5c4166ea1423aec4560f155/test/functional/find_tests.js#L1111
     */
    errmsg?: string;
    name: string;
}

export type RootQuerySelector<T> = {
    /** https://docs.mongodb.com/manual/reference/operator/query/and/#op._S_and */
    // TODO $and?: Array<FilterQuery<T>>;
    /** https://docs.mongodb.com/manual/reference/operator/query/nor/#op._S_nor */
    // TODO $nor?: Array<FilterQuery<T>>;
    /** https://docs.mongodb.com/manual/reference/operator/query/or/#op._S_or */
    // TODO $or?: Array<FilterQuery<T>>;
    /** https://docs.mongodb.com/manual/reference/operator/query/text */
    $text?: {
        $search: string;
        // TODO $language?: string;
        // TODO $caseSensitive?: boolean;
        // TODO $diacraticSensitive?: boolean;
    };
    /** https://docs.mongodb.com/manual/reference/operator/query/where/#op._S_where */
    // TODO $where?: string | Function;
    /** https://docs.mongodb.com/manual/reference/operator/query/comment/#op._S_comment */
    // TODO $comment?: string;
    // we could not find a proper TypeScript generic to support nested queries e.g. 'user.friends.name'
    // this will mark all unrecognized properties as any (including nested queries)
    [key: string]: any;
};

export type MongoCallback<T> = (error: MongoError, result: T) => void;

/** http://mongodb.github.io/node-mongodb-native/3.1/api/Db.html#collection */
export interface DbCollectionOptions extends CommonOptions {
    // TODO raw?: boolean;
    // TODO pkFactory?: object;
    // TODO readPreference?: ReadPreferenceOrMode;
    // TODO serializeFunctions?: boolean;
    // TODO strict?: boolean;
    // TODO readConcern?: ReadConcern;
}

export type DefaultSchema = any;

export type Condition<T> = {}; // TODO MongoAltQuery<T> | QuerySelector<MongoAltQuery<T>>;

export type FilterQuery<T> = {
    [P in keyof T]?: Condition<T[P]>;
} &
    RootQuerySelector<T>;

type ReadonlyPartial<TSchema> = {
    readonly [key in keyof TSchema]?: TSchema[key];
};

type DotAndArrayNotation<AssignableType> = {
    readonly [key: string]: AssignableType;
};

export type MatchKeysAndValues<TSchema> = ReadonlyPartial<TSchema> & DotAndArrayNotation<any>;

/** http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#findOne */
export interface FindOneOptions {
    // TODO: limit?: number;
    // TODO: sort?: any[] | object;
    projection?: object;
    /**
     * @deprecated Use options.projection instead
     */
    // TODO: fields?: object;
    // TODO: skip?: number;
    // TODO: hint?: object;
    // TODO: explain?: boolean;
    // TODO: snapshot?: boolean;
    // TODO: timeout?: boolean;
    // TODO: tailable?: boolean;
    // TODO: batchSize?: number;
    // TODO: returnKey?: boolean;
    // TODO: maxScan?: number;
    // TODO: min?: number;
    // TODO: max?: number;
    // TODO: showDiskLoc?: boolean;
    // TODO: comment?: string;
    // TODO: raw?: boolean;
    // TODO: promoteLongs?: boolean;
    // TODO: promoteValues?: boolean;
    // TODO: promoteBuffers?: boolean;
    // TODO: readPreference?: ReadPreferenceOrMode;
    // TODO: partial?: boolean;
    // TODO: maxTimeMS?: number;
    // TODO: collation?: CollationDocument;
    // TODO: session?: ClientSession;

    /**
     * Elasticsearch only option to specify the page size to fetch when fetching lots of documents.
     */
    esPageSize?: number;
}

/**
 * A MongoDB WriteConcern, which describes the level of acknowledgement
 * requested from MongoDB for write operations.
 * http://mongodb.github.io/node-mongodb-native/3.1/api/global.html#WriteConcern
 */
interface WriteConcern {
    /**
     * requests acknowledgement that the write operation has
     * propagated to a specified number of mongod hosts
     * @default 1
     */
    // TODO: w?: number | 'majority' | string;
    /**
     * requests acknowledgement from MongoDB that the write operation has
     * been written to the journal
     * @default false
     */
    // TODO: j?: boolean;
    /**
     * a time limit, in milliseconds, for the write concern
     */
    // TODO: wtimeout?: number;
}

export interface CommonOptions extends WriteConcern {
    // TODO: session?: ClientSession;
}

/** http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#updateMany */
export interface UpdateManyOptions extends CommonOptions {
    // TODO: upsert?: boolean;
    // TODO: arrayFilters?: object[];
}

/** http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#insertOne */
export interface CollectionInsertOneOptions extends CommonOptions {
    /**
     * Serialize functions on any object.
     */
    // TODO: serializeFunctions?: boolean;
    // Force server to assign _id values instead of driver.
    // TODO: forceServerObjectId?: boolean;
    // Allow driver to bypass schema validation in MongoDB 3.2 or higher.
    // TODO: bypassDocumentValidation?: boolean;
}

export type ObjectId = string;

type EnhancedOmit<T, K extends string | number | symbol> = string | number extends keyof T
    ? T // T has indexed type e.g. { _id: string; [k: string]: any; } or it is "any"
    : Omit<T, K>;

type ExtractIdType<TSchema> = TSchema extends { _id: infer U } // user has defined a type for _id
    ? {} extends U
        ? Exclude<U, {}>
        : unknown extends U
        ? ObjectId
        : U
    : ObjectId; // user has not defined _id on schema

// this makes _id optional
export type OptionalId<TSchema extends { _id?: any }> = ObjectId extends TSchema['_id'] // a Schema with ObjectId _id type or "any" or "indexed type" provided
    ? EnhancedOmit<TSchema, '_id'> & { _id?: ExtractIdType<TSchema> } // a Schema provided but _id type is not ObjectId
    : WithId<TSchema>;

// this adds _id as a required property
export type WithId<TSchema> = EnhancedOmit<TSchema, '_id'> & { _id: ExtractIdType<TSchema> };

export type CursorResult = object | null | boolean;

/** http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#~insertOneWriteOpResult */
export interface InsertOneWriteOpResult<TSchema extends { _id: any }> {
    insertedCount: number;
    // TODO: ops: TSchema[];
    insertedId: TSchema['_id'];
    // TODO: connection: any;
    result: { ok: number; n: number };
}

/** https://docs.mongodb.com/manual/reference/operator/update */
export type UpdateQuery<TSchema> = {
    /** https://docs.mongodb.com/manual/reference/operator/update-field/ */
    // TODO: $currentDate?: OnlyFieldsOfType<TSchema, Date, true | { $type: 'date' | 'timestamp' }>;
    // TODO: $inc?: OnlyFieldsOfType<TSchema, number | undefined>;
    // TODO: $min?: MatchKeysAndValues<TSchema>;
    // TODO: $max?: MatchKeysAndValues<TSchema>;
    // TODO: $mul?: OnlyFieldsOfType<TSchema, number | undefined>;
    // TODO: $rename?: { [key: string]: string };
    $set?: MatchKeysAndValues<TSchema>;
    // TODO: $setOnInsert?: MatchKeysAndValues<TSchema>;
    // TODO: $unset?: OnlyFieldsOfType<TSchema, any, '' | 1 | true>;

    /** https://docs.mongodb.com/manual/reference/operator/update-array/ */
    // TODO: $addToSet?: SetFields<TSchema>;
    // TODO: $pop?: OnlyFieldsOfType<TSchema, any[], 1 | -1>;
    // TODO: $pull?: PullOperator<TSchema>;
    // TODO: $push?: PushOperator<TSchema>;
    // TODO: $pullAll?: PullAllOperator<TSchema>;

    /** https://docs.mongodb.com/manual/reference/operator/update-bitwise/ */
    // TODO: $bit?: {
    // TODO:     [key: string]: { [key in 'and' | 'or' | 'xor']?: number };
    // TODO: };
};

/** http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#~updateWriteOpResult */
export interface UpdateWriteOpResult {
    // TODO: result: { ok: number; n: number; nModified: number };
    // TODO: connection: any;
    // TODO: matchedCount: number;
    // TODO: modifiedCount: number;
    // TODO: upsertedCount: number;
    // TODO: upsertedId: { _id: ObjectId };
}

/** http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#replaceOne */
export interface ReplaceOneOptions extends CommonOptions {
    // TODO: upsert?: boolean;
    // TODO: bypassDocumentValidation?: boolean;
}

/** http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#updateOne */
export interface UpdateOneOptions extends ReplaceOneOptions {
    // TODO: arrayFilters?: object[];
}
