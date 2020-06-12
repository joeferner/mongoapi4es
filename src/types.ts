// see https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/mongodb/index.d.ts

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
export interface FindOneOptions<T> {
    // TODO: limit?: number;
    // TODO: sort?: any[] | object;
    projection?: { [P in keyof T]?: boolean };
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
