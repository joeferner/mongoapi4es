export interface QueryResults<T> {
    total: {
        value: number;
        relation: 'eq';
    };
    hits: any[];
}
