import { dateToDaystep } from './chrono.js';

export class Pretty {
    public static date(date: Date) {
        return date.getDate().toString().padStart(2, '0') + '.' + (date.getMonth() + 1).toString().padStart(2, '0') + '.' + (date.getFullYear() - 2000).toString().padStart(2, '0');
    }

    public static time(date: Date) {
        return date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');
    }

    public static datetime(date: Date) {
        return Pretty.date(date) + ' ' + Pretty.time(date);
    }

    public static quaterday(date: Date) {
        const hour = date.getHours();
        if (hour < 6) {
            return 'ночью';
        } else if (hour < 12) {
            return 'утром';
        } else if (hour < 18) {
            return 'днем';
        } else {
            return 'вечером';
        }
    }
    public static pluralize(value: number, text1: string, text2: string, text5: string){
        return text1; // TOOD
    }
    public static relativeDay(date: Date, now = new Date()) {
        const referenceDaystep = dateToDaystep(date);
        const nowDaystep = dateToDaystep(now);
        const daystepDiff = referenceDaystep - nowDaystep;
        if (daystepDiff === 0) {
            if (Math.abs(date.valueOf() - now.valueOf()) < 1000 * 60 * 60) {
                return 'сейчас';
            } else {
                return 'сегодня';
            }
        } else if (daystepDiff === 1) {
            return 'завтра';
        } else if (daystepDiff === 2) {
            return 'послезавтра';
        } else if (daystepDiff === -1) {
            return 'вчера';
        } else if (daystepDiff === -2) {
            return 'позавчера';
        } else if (daystepDiff > 0) {
            return `через ${daystepDiff} ${this.pluralize(daystepDiff, 'день', 'дня', 'дней')}`;
        } else if (daystepDiff < 0) {
            return `${-daystepDiff} ${this.pluralize(-daystepDiff, 'день', 'дня', 'дней')} назад`;
        } else {
            throw new Error();
        }
    }
    public static relativeQuaterDay(date: Date, now = new Date()) {
        return Pretty.relativeDay(date, now) + ' ' + Pretty.quaterday(date);
    }
    public static number(value: number | undefined, precision: number = 0, isExplicitPrecision: boolean = false): string {
        if (value === undefined) {
            return '';
        } else {
            if (isExplicitPrecision) {
                return value.toFixed(precision);
            } else {
                return parseFloat(value.toFixed(precision)).toString();
            }
        }
    }
    public static relativeHour(date: Date, now = new Date()) {
        const timestepDiff = date.valueOf() - now.valueOf();
        const timestepDist = Math.abs(timestepDiff);
        const isWithinHour = (timestepDist <= 1000 * 60 * 60);

        if (isWithinHour) {
            if (timestepDiff === 0) {
                return 'сейчас';
            } else if (timestepDiff > 0) {
                return `менее чем через час`;
            } else if (timestepDiff < 0) {
                return `менее чем час назад`;
            } else {
                return 'сейчас';
            }
        } else {
            const hourDiff = Math.round(timestepDiff / (1000 * 60 * 60));
            if (hourDiff > 0) {
                return `через ${hourDiff} ${this.pluralize(hourDiff, 'час', 'часа', 'часов')}`;
            } else if (hourDiff < 0) {
                return `${-hourDiff} ${this.pluralize(-hourDiff, 'час', 'часа', 'часов')} назад`;
            } else {
                throw new Error();
            }
        }
    }

}
