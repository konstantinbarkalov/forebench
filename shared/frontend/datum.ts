export type providerKeyT = 'openWeather' |
                            'foreca' |
                            'yandex' |
                            'gidromet';


export type ByProviderT<valueG> = {
    [key in providerKeyT]: valueG;
}
export class HourReading {
    constructor (
        public temperature: number,
        public actualDate: Date,
    ) {
    }
    toPlainTree() {
        return {
            temperature: this.temperature,
            actualDate: this.actualDate.valueOf(),
        }
    }
    static fromPlainTree(plainTree: any) {
        const temperature = plainTree.temperature;
        const actualDate = new Date(plainTree.actualDate);
        return new HourReading(temperature, actualDate);
    }
}

export class HourForecast {
    constructor (
        public temperature: {
            min: number,
            max: number,
            mean: number,
        },
        public actualDate: Date,
    ) {
    }
    toPlainTree() {
        return {
            temperature: {
                min: this.temperature.min,
                mean: this.temperature.mean,
                max: this.temperature.max,
            },
            actualDate: this.actualDate.valueOf(),
        }
    }
    static fromPlainTree(plainTree: any) {
        const temperature = {
                min: plainTree.temperature.min,
                mean: plainTree.temperature.mean,
                max: plainTree.temperature.max,
        };
        const actualDate = new Date(plainTree.actualDate);
        return new HourForecast(temperature, actualDate);
    }

}

export class HourProviderData {
    constructor (
        public reading: HourReading,
        public forecasts: HourForecast[],
    ) {
    }
    toPlainTree() {
        return {
            reading: this.reading.toPlainTree(),
            forecasts: this.forecasts.map(element => element.toPlainTree()),
        }
    }
    static fromPlainTree(plainTree: any) {
        const reading = HourReading.fromPlainTree(plainTree.reading);
        const forecastPlainTrees: any[] = plainTree.forecasts;
        const forecasts: HourForecast[] = forecastPlainTrees.map(forecastPlainTree => HourForecast.fromPlainTree(forecastPlainTree));
        return new HourProviderData(reading, forecasts);
    }
}

export class HourReferenceData {
    constructor (
        public reading: HourReading,
    ) {
    }
    toPlainTree() {
        return {
            reading: this.reading.toPlainTree(),
        }
    }
    static fromPlainTree(plainTree: any) {
        const reading = HourReading.fromPlainTree(plainTree.reading);
        return new HourReferenceData(reading);
    }

}

export class HourData {
    constructor (
        public byProvider: ByProviderT<HourProviderData>,
        public reference: HourReferenceData,
        public hourstep: number,
    ) {

    }
    toPlainTree() {
        return {
            byProvider: {
                openWeather: this.byProvider.openWeather.toPlainTree(),
                foreca: this.byProvider.foreca.toPlainTree(),
                yandex: this.byProvider.yandex.toPlainTree(),
                gidromet: this.byProvider.gidromet.toPlainTree(),
            },
            reference: this.reference.toPlainTree(),
            hourstep: this.hourstep,
        }
    }
    static fromPlainTree(plainTree: any) {
        const byProvider = {
            openWeather: HourProviderData.fromPlainTree(plainTree.byProvider.openWeather),
            foreca: HourProviderData.fromPlainTree(plainTree.byProvider.foreca),
            yandex: HourProviderData.fromPlainTree(plainTree.byProvider.yandex),
            gidromet: HourProviderData.fromPlainTree(plainTree.byProvider.gidromet),
        }
        const reference = HourReferenceData.fromPlainTree(plainTree.reference);
        const hourstep = plainTree.hourstep;
        return new HourData(byProvider, reference, hourstep);
    }
}

export class HourDatumBundle {
    constructor (
        public datum: HourData[],
    ) {

    }
    toPlainTree() {
        return {
            datum: this.datum.map(element => element.toPlainTree()),
        }
    }
    static fromPlainTree(plainTree: any) {
        const dataPlainTrees: any[] = plainTree.datum;
        const datum: HourData[] = dataPlainTrees.map(dataPlainTree => HourData.fromPlainTree(dataPlainTree));
        return new HourDatumBundle(datum);
    }
}


