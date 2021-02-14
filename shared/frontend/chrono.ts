export function hourstepToDate(hourstep: number) {
    const base = new Date('2020-01-01').valueOf();
    const date = new Date(hourstep * 60 * 60 * 1000 + base);
    return date;
}
export function dateToHourstep(date: Date) {
    const base = new Date('2020-01-01').valueOf();
    const hourstep = Math.floor((date.valueOf() - base) / (60 * 60 * 1000));
    return hourstep;
}

export function quaterdaystepToDate(quaterdaystep: number, timezoneOffset: number = (new Date()).getTimezoneOffset()) {
    const base = new Date('2020-01-01').valueOf() + timezoneOffset * 60 * 1000;
    const date = new Date(quaterdaystep * 6 * 60 * 60 * 1000 + base);
    return date;
}
export function dateToQuaterdaystep(date: Date, timezoneOffset: number = date.getTimezoneOffset()) {
    const base = new Date('2020-01-01').valueOf() + timezoneOffset * 60 * 1000;
    const quaterdaystep = Math.floor((date.valueOf() - base) / (6 * 60 * 60 * 1000));
    return quaterdaystep;
}
export function daystepToDate(daystep: number, timezoneOffset: number = (new Date()).getTimezoneOffset()) {
    const base = new Date('2020-01-01').valueOf() + timezoneOffset * 60 * 1000;
    const date = new Date(daystep * 24 * 60 * 60 * 1000 + base);
    return date;
}
export function dateToDaystep(date: Date, timezoneOffset: number = date.getTimezoneOffset()) {
    const base = new Date('2020-01-01').valueOf() + timezoneOffset * 60 * 1000;
    const daystep = Math.floor((date.valueOf() - base) / (24 * 60 * 60 * 1000));
    return daystep;
}
