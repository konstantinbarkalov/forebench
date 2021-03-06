import { ChartByProviderDatum, ChartDatum, ChartPointData, ChartPointSerialDatum } from './chartDatumWidget.js';
import { HourData, providerKeyT } from './shared/frontend/datum.js';
import { Kdvu } from './kdvu.js';
import { ProviderBrick } from "./brick/providerBrick/providerBrick.js";
import { ActiveTimestepBrick } from './brick/activeTimestepBrick/activeTimestepBrick.js';
import { TimestepBrick } from './brick/timestepBrick/timestepBrick.js';
import { Mmm } from './mmm.js';
import { hourstepToDate } from './shared/frontend/chrono.js';

export type rgbaT = {
    r: number,
    g: number,
    b: number,
    a: number
}
export type sizeT = {
    width: number,
    height: number
}

export type positionT = {
    x: number,
    y: number
}
export type remapFnT = (localPosition: positionT) => positionT;

export function clampRgba(rgba: rgbaT): rgbaT {
    return {
        r: Math.max(0, Math.min(1, rgba.r)),
        g: Math.max(0, Math.min(1, rgba.g)),
        b: Math.max(0, Math.min(1, rgba.b)),
        a: Math.max(0, Math.min(1, rgba.a)),
    }
}
export function clampLocalPosition(localPosition: positionT): positionT {
    return {
        x: Math.max(0, Math.min(1, localPosition.x)),
        y: Math.max(0, Math.min(1, localPosition.y)),
    }
}
export function rgbaToHtmlColor(rgba: rgbaT): string {
    const clampedRgba = clampRgba(rgba);
    return `rgba(${Math.floor(clampedRgba.r * 255)}, ${Math.floor(clampedRgba.g * 255)}, ${Math.floor(clampedRgba.b * 255)}, ${clampedRgba.a})`
}


export const providerColors: {[key in providerKeyT]: rgbaT} = {
    openWeather: {r: 1.00, g: 0.50, b: 0.00, a: 1},
    foreca: {r: 0.00, g: 1.00, b: 0.50, a: 1},
    yandex: {r: 0.50, g: 0.00, b: 1.00, a: 1},
    gidromet: {r: 1.00, g: 0.00, b: 0.50, a: 0},
}
export const quaterdayColors: [rgbaT, rgbaT, rgbaT, rgbaT] = [
    {r: 60/255, g: 51/255, b: 68/255, a: 1},
    {r: 255/255, g: 197/255, b: 136/255, a: 1},
    {r: 255/255, g: 238/255, b: 204/255, a: 1},
    {r: 102/255, g: 136/255, b: 170/255, a: 1},
]
export function dimColor(color: rgbaT, ratio: number = 0.5): rgbaT {
    return {
        r: color.r * ratio,
        g: color.g * ratio,
        b: color.b * ratio,
        a: color.a,
    }
}
export function hourDataToProviderBricks(hourData: HourData, timestepBrickIdx: number): ProviderBrick[] {
    const hourstepBasedLiveDate = hourstepToDate(hourData.hourstep);
    const providerKeys: providerKeyT[] = [
        'openWeather',
        'foreca',
        'yandex',
        'gidromet',
    ];

    if (timestepBrickIdx === 0) {
        const providerBricks = providerKeys.map(providerKey => {
            const title: string = providerKey;
            const suptitle: string = '';
            const values: Kdvu[] = [
                new Kdvu('температура', undefined, hourData.byProvider[providerKey].reading.temperature, undefined, 'C°'),
            ];
            const color = providerColors[providerKey];
            const providerBrick = new ProviderBrick(hourstepBasedLiveDate, title, suptitle, values, color);
            return providerBrick;
        });
        return providerBricks;
    } else {
        const forecastIdx = timestepBrickIdx * 6 - 1;
        const hourstepBasedForecastDate = hourstepToDate(hourData.hourstep + forecastIdx);
        const providerBricks = providerKeys.map(providerKey => {
            const title: string = providerKey;
            const suptitle: string = '';
            const values: Kdvu[] = [
                new Kdvu('температура', hourData.byProvider[providerKey].forecasts[forecastIdx].temperature.min, hourData.byProvider[providerKey].forecasts[forecastIdx].temperature.mean, hourData.byProvider[providerKey].forecasts[forecastIdx].temperature.max, 'C°'),
            ];
            const color = providerColors[providerKey];
            const providerBrick = new ProviderBrick(hourstepBasedForecastDate, title, suptitle, values, color);
            return providerBrick;
        });
        return providerBricks;
    }
}
export function hourDataToTimestepBricks(hourData: HourData): TimestepBrick[] {
    const hourstepBasedLiveDate = hourstepToDate(hourData.hourstep);
    const values: Kdvu[] = [
        new Kdvu('openWeather', undefined, hourData.byProvider.openWeather.reading.temperature, undefined, 'C°'),
        new Kdvu('foreca', undefined, hourData.byProvider.foreca.reading.temperature, undefined, 'C°'),
        new Kdvu('yandex', undefined, hourData.byProvider.yandex.reading.temperature, undefined, 'C°'),
        new Kdvu('gidromet', undefined, hourData.byProvider.gidromet.reading.temperature, undefined, 'C°'),
    ];
    const hourstepPerBrick = 6;
    const liveBrick = new TimestepBrick(hourstepBasedLiveDate, values);
    const forecastsMaxLength = Math.max(hourData.byProvider.openWeather.forecasts.length, hourData.byProvider.foreca.forecasts.length, hourData.byProvider.yandex.forecasts.length, hourData.byProvider.gidromet.forecasts.length);
    const forecastBricks = [];
    const forecastBricksCount = Math.floor(forecastsMaxLength / hourstepPerBrick);
    for (let forecastBrickIdx = 0; forecastBrickIdx <  forecastBricksCount; forecastBrickIdx++) {
        const forecastIdx = (hourstepPerBrick - 1) + forecastBrickIdx * hourstepPerBrick;
        const forecastHourstep = hourData.hourstep + forecastIdx + 1;
        const hourstepBasedForecastDate = hourstepToDate(forecastHourstep);
        const values: Kdvu[] = [
            new Kdvu('openWeather', hourData.byProvider.openWeather.forecasts[forecastIdx]?.temperature.min, undefined, hourData.byProvider.openWeather.forecasts[forecastIdx]?.temperature.max, 'C°'),
            new Kdvu('foreca', hourData.byProvider.foreca.forecasts[forecastIdx]?.temperature.min, undefined, hourData.byProvider.foreca.forecasts[forecastIdx]?.temperature.max, 'C°'),
            new Kdvu('yandex', hourData.byProvider.yandex.forecasts[forecastIdx]?.temperature.min, undefined, hourData.byProvider.yandex.forecasts[forecastIdx]?.temperature.max, 'C°'),
            new Kdvu('gidromet', hourData.byProvider.gidromet.forecasts[forecastIdx]?.temperature.min, undefined, hourData.byProvider.gidromet.forecasts[forecastIdx]?.temperature.max, 'C°'),
        ];
        const forecastBrick = new TimestepBrick(hourstepBasedForecastDate, values);
        forecastBricks[forecastBrickIdx] = forecastBrick;
    }

    const bricks = [liveBrick, ...forecastBricks];
    return bricks;
}
export function hourDataToActiveTimestepBrick(hourData: HourData, timestepBrickIdx: number): ActiveTimestepBrick {
    if (timestepBrickIdx === 0) {
        const hourstepBasedLiveDate = hourstepToDate(hourData.hourstep);
        const activeTimestepBrick = new ActiveTimestepBrick(hourstepBasedLiveDate);
        return activeTimestepBrick;
    } else {
        const forecastIdx = timestepBrickIdx * 6 - 1;
        const hourstepBasedForecastDate = hourstepToDate(hourData.hourstep + 1 + forecastIdx);
        const activeTimestepBrick = new ActiveTimestepBrick(hourstepBasedForecastDate);
        return activeTimestepBrick;
    }

}
export function hourDatumToOverviewChartDatum(hourDatum: HourData[], timemachineHourstep: number): ChartDatum {
    const firstHourstep = hourDatum[0].hourstep;
    const lastHourstep = hourDatum[hourDatum.length - 1].hourstep;
    const timemachineShift = timemachineHourstep - firstHourstep + 1;
    const timemachineNowHourDatum = hourDatum.slice(0, timemachineShift); // TODO
    if (timemachineNowHourDatum.length > 0 ) {
        const openWeatherChartDatum = timemachineNowHourDatum.map(hourData => {
            const mmm = new Mmm(hourData.byProvider.openWeather.reading.temperature, hourData.byProvider.openWeather.reading.temperature, hourData.byProvider.openWeather.reading.temperature);
            const chartPointData = new ChartPointData(mmm);
            return chartPointData;
        });
        const forecaChartDatum = timemachineNowHourDatum.map(hourData => {
            const mmm = new Mmm(hourData.byProvider.foreca.reading.temperature, hourData.byProvider.foreca.reading.temperature, hourData.byProvider.foreca.reading.temperature);
            const chartPointData = new ChartPointData(mmm);
            return chartPointData;
        });
        const yandexChartDatum = timemachineNowHourDatum.map(hourData => {
            const mmm = new Mmm(hourData.byProvider.yandex.reading.temperature, hourData.byProvider.yandex.reading.temperature, hourData.byProvider.yandex.reading.temperature);
            const chartPointData = new ChartPointData(mmm);
            return chartPointData;
        });
        const gidrometChartDatum = timemachineNowHourDatum.map(hourData => {
            const mmm = new Mmm(hourData.byProvider.gidromet.reading.temperature, hourData.byProvider.gidromet.reading.temperature, hourData.byProvider.gidromet.reading.temperature);
            const chartPointData = new ChartPointData(mmm);
            return chartPointData;
        });
        const referenceChartDatum = timemachineNowHourDatum.map(hourData => {
            const mmm = new Mmm(hourData.reference.reading.temperature, hourData.reference.reading.temperature, hourData.reference.reading.temperature);
            const chartPointData = new ChartPointData(mmm);
            return chartPointData;
        });
        const historyChartDatum = hourDatum.map(hourData => {
            const mmm = new Mmm(hourData.reference.reading.temperature, hourData.reference.reading.temperature, hourData.reference.reading.temperature);
            const chartPointData = new ChartPointData(mmm);
            return chartPointData;
        });

        /////////////////////
        /////////////////////
        /////////////////////
        const openWeatherChartForecastDatum = [];
        const forecaChartForecastDatum = [];
        const yandexChartForecastDatum = [];
        const gidrometChartForecastDatum = [];
        const lastHourData = timemachineNowHourDatum[timemachineNowHourDatum.length - 1];
        { // openWeather
            const forecastData = lastHourData.byProvider.openWeather.reading;
            const mmm = new Mmm(forecastData.temperature, forecastData.temperature, forecastData.temperature);
            openWeatherChartForecastDatum[0] = new ChartPointData(mmm);
        }
        { // foreca
            const forecastData = lastHourData.byProvider.foreca.reading;
            const mmm = new Mmm(forecastData.temperature, forecastData.temperature, forecastData.temperature);
            forecaChartForecastDatum[0] = new ChartPointData(mmm);
        }
        { // yandex
            const forecastData = lastHourData.byProvider.yandex.reading;
            const mmm = new Mmm(forecastData.temperature, forecastData.temperature, forecastData.temperature);
            yandexChartForecastDatum[0] = new ChartPointData(mmm);
        }
        { // gidromet
            const forecastData = lastHourData.byProvider.gidromet.reading;
            const mmm = new Mmm(forecastData.temperature, forecastData.temperature, forecastData.temperature);
            gidrometChartForecastDatum[0] = new ChartPointData(mmm);
        }

        const forecastLength = 96;

        for (let i = 0; i < forecastLength; i++) {
            { // openWeather
                const forecastData = lastHourData.byProvider.openWeather.forecasts[i];
                const mmm = new Mmm(forecastData.temperature.min, forecastData.temperature.mean, forecastData.temperature.max);
                openWeatherChartForecastDatum[i + 1] = new ChartPointData(mmm);
            }
            { // foreca
                const forecastData = lastHourData.byProvider.foreca.forecasts[i];
                const mmm = new Mmm(forecastData.temperature.min, forecastData.temperature.mean, forecastData.temperature.max);
                forecaChartForecastDatum[i + 1] = new ChartPointData(mmm);
            }
            { // yandex
                const forecastData = lastHourData.byProvider.yandex.forecasts[i];
                const mmm = new Mmm(forecastData.temperature.min, forecastData.temperature.mean, forecastData.temperature.max);
                yandexChartForecastDatum[i + 1] = new ChartPointData(mmm);
            }
            { // gidromet
                const forecastData = lastHourData.byProvider.gidromet.forecasts[i];
                const mmm = new Mmm(forecastData.temperature.min, forecastData.temperature.mean, forecastData.temperature.max);
                gidrometChartForecastDatum[i + 1] = new ChartPointData(mmm);
            }
        }

        /////////////////////
        /////////////////////
        /////////////////////

        return new ChartDatum(new ChartByProviderDatum(
            new ChartPointSerialDatum(openWeatherChartDatum, 0),
            new ChartPointSerialDatum(forecaChartDatum, 0),
            new ChartPointSerialDatum(yandexChartDatum, 0),
            new ChartPointSerialDatum(gidrometChartDatum, 0),
        ), new ChartByProviderDatum(
            new ChartPointSerialDatum(openWeatherChartForecastDatum, timemachineNowHourDatum.length - 1),
            new ChartPointSerialDatum(forecaChartForecastDatum, timemachineNowHourDatum.length - 1),
            new ChartPointSerialDatum(yandexChartForecastDatum, timemachineNowHourDatum.length - 1),
            new ChartPointSerialDatum(gidrometChartForecastDatum, timemachineNowHourDatum.length - 1),
        ), new ChartPointSerialDatum(referenceChartDatum, 0), new ChartPointSerialDatum(historyChartDatum, 0), timemachineNowHourDatum.length + forecastLength, firstHourstep, 'C°');
    } else {
        return new ChartDatum(new ChartByProviderDatum(
            new ChartPointSerialDatum([], 0),
            new ChartPointSerialDatum([], 0),
            new ChartPointSerialDatum([], 0),
            new ChartPointSerialDatum([], 0),
        ), new ChartByProviderDatum(
            new ChartPointSerialDatum([], 0),
            new ChartPointSerialDatum([], 0),
            new ChartPointSerialDatum([], 0),
            new ChartPointSerialDatum([], 0),
        ), new ChartPointSerialDatum([], 0), new ChartPointSerialDatum([], 0), 0, firstHourstep, 'C°');
    }
}

export function hourDatumToAnalysisChartDatum(hourDatum: HourData[], timestepBrickIdx: number): ChartDatum {
    let firstHourstep = hourDatum[0].hourstep;
    let lastHourstep = hourDatum[hourDatum.length - 1].hourstep;
    if (timestepBrickIdx === 0) {
        const openWeatherChartDatum = hourDatum.map(hourData => {
            const mmm = new Mmm(hourData.byProvider.openWeather.reading.temperature, hourData.byProvider.openWeather.reading.temperature, hourData.byProvider.openWeather.reading.temperature);
            const chartPointData = new ChartPointData(mmm);
            return chartPointData;
        });
        const forecaChartDatum = hourDatum.map(hourData => {
            const mmm = new Mmm(hourData.byProvider.foreca.reading.temperature, hourData.byProvider.foreca.reading.temperature, hourData.byProvider.foreca.reading.temperature);
            const chartPointData = new ChartPointData(mmm);
            return chartPointData;
        });
        const yandexChartDatum = hourDatum.map(hourData => {
            const mmm = new Mmm(hourData.byProvider.yandex.reading.temperature, hourData.byProvider.yandex.reading.temperature, hourData.byProvider.yandex.reading.temperature);
            const chartPointData = new ChartPointData(mmm);
            return chartPointData;
        });
        const gidrometChartDatum = hourDatum.map(hourData => {
            const mmm = new Mmm(hourData.byProvider.gidromet.reading.temperature, hourData.byProvider.gidromet.reading.temperature, hourData.byProvider.gidromet.reading.temperature);
            const chartPointData = new ChartPointData(mmm);
            return chartPointData;
        });
        const referenceChartDatum = hourDatum.map(hourData => {
            const mmm = new Mmm(hourData.reference.reading.temperature, hourData.reference.reading.temperature, hourData.reference.reading.temperature);
            const chartPointData = new ChartPointData(mmm);
            return chartPointData;
        });
        const historyChartDatum = referenceChartDatum;

        return new ChartDatum(new ChartByProviderDatum(
            new ChartPointSerialDatum([], 0),
            new ChartPointSerialDatum([], 0),
            new ChartPointSerialDatum([], 0),
            new ChartPointSerialDatum([], 0),
        ), new ChartByProviderDatum(
            new ChartPointSerialDatum(openWeatherChartDatum, 0),
            new ChartPointSerialDatum(forecaChartDatum, 0),
            new ChartPointSerialDatum(yandexChartDatum, 0),
            new ChartPointSerialDatum(gidrometChartDatum, 0),
        ), new ChartPointSerialDatum(referenceChartDatum, 0), new ChartPointSerialDatum(historyChartDatum, 0), hourDatum.length, firstHourstep, 'C°');
    } else {
        const forecastIdx = timestepBrickIdx * 6 - 1;
        const openWeatherChartDatum = hourDatum.map(hourData => {
            const mmm = new Mmm(hourData.byProvider.openWeather.forecasts[forecastIdx].temperature.min, hourData.byProvider.openWeather.forecasts[forecastIdx].temperature.mean, hourData.byProvider.openWeather.forecasts[forecastIdx].temperature.max);
            const chartPointData = new ChartPointData(mmm);
            return chartPointData;
        });
        const forecaChartDatum = hourDatum.map(hourData => {
            const mmm = new Mmm(hourData.byProvider.foreca.forecasts[forecastIdx].temperature.min, hourData.byProvider.foreca.forecasts[forecastIdx].temperature.mean, hourData.byProvider.foreca.forecasts[forecastIdx].temperature.max);
            const chartPointData = new ChartPointData(mmm);
            return chartPointData;
        });
        const yandexChartDatum = hourDatum.map(hourData => {
            const mmm = new Mmm(hourData.byProvider.yandex.forecasts[forecastIdx].temperature.min, hourData.byProvider.yandex.forecasts[forecastIdx].temperature.mean, hourData.byProvider.yandex.forecasts[forecastIdx].temperature.max);
            const chartPointData = new ChartPointData(mmm);
            return chartPointData;
        });
        const gidrometChartDatum = hourDatum.map(hourData => {
            const mmm = new Mmm(hourData.byProvider.gidromet.forecasts[forecastIdx].temperature.min, hourData.byProvider.gidromet.forecasts[forecastIdx].temperature.mean, hourData.byProvider.gidromet.forecasts[forecastIdx].temperature.max);
            const chartPointData = new ChartPointData(mmm);
            return chartPointData;
        });
        const referenceChartDatum = hourDatum.map(hourData => {
            const mmm = new Mmm(hourData.reference.reading.temperature, hourData.reference.reading.temperature, hourData.reference.reading.temperature);
            const chartPointData = new ChartPointData(mmm);
            return chartPointData;
        });
        referenceChartDatum.splice(0, forecastIdx + 1);
        const historyChartDatum = referenceChartDatum;
        return new ChartDatum(new ChartByProviderDatum(
            new ChartPointSerialDatum([], 0), // TODO!!!!!!!!!!!!!!!!!!
            new ChartPointSerialDatum([], 0),
            new ChartPointSerialDatum([], 0),
            new ChartPointSerialDatum([], 0),
        ), new ChartByProviderDatum(
            new ChartPointSerialDatum(openWeatherChartDatum, 0),
            new ChartPointSerialDatum(forecaChartDatum, 0),
            new ChartPointSerialDatum(yandexChartDatum, 0),
            new ChartPointSerialDatum(gidrometChartDatum, 0),
        ), new ChartPointSerialDatum(referenceChartDatum, 0), new ChartPointSerialDatum(historyChartDatum, 0), hourDatum.length, firstHourstep + 1 + forecastIdx, 'C°');
    }
}
