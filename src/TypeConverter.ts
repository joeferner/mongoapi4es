export class TypeConverter {
    static readonly DATE_TIME_FORMAT = /[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z/;

    static convertEsTypesToJs(obj: any) {
        for (const key of Object.keys(obj)) {
            if (key === '_id') {
                continue;
            }
            const value = obj[key];
            if (typeof value === 'object') {
                this.convertEsTypesToJs(value);
            } else if (typeof value === 'string') {
                if (value.match(TypeConverter.DATE_TIME_FORMAT)) {
                    obj[key] = new Date(value);
                }
            }
        }
        return obj;
    }
}
