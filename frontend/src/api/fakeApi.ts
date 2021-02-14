
import { dateToHourstep, hourstepToDate } from '../shared/frontend/chrono.js';
import { HourProviderData, HourForecast, HourReading, HourReferenceData, HourData, HourDatumBundle } from '../shared/frontend/datum.js';
import { AbstractApi } from './abstractApi.js';


export class FakeApi extends AbstractApi {
    private generateHourProviderData(hourstep: number): HourProviderData {
        const forecasts: HourForecast[] = [];
        for (let forecastIdx = 0; forecastIdx < 96; forecastIdx++) {
            const forecastHourstep = hourstep + 1 + forecastIdx;
            const forecastingIdealSintemp = Math.sin(((forecastHourstep / 12) - 0.75) * Math.PI) * 10 + 15 + Math.sin(forecastHourstep / 120 * Math.PI) * 2;
            const fakeMinTemp = forecastingIdealSintemp + (Math.random() - 0.5) * forecastIdx / 2;
            const fakeMaxTemp = forecastingIdealSintemp + (Math.random() - 0.5) * forecastIdx / 2;
            const fakeMeanTemp = (fakeMinTemp + fakeMaxTemp) / 2 + (Math.random() - 0.5) * (fakeMaxTemp - fakeMinTemp) / 2;
            const forecast = new HourForecast({ min: fakeMinTemp, max: fakeMaxTemp, mean: fakeMeanTemp }, hourstepToDate(forecastHourstep));
            forecasts[forecastIdx] = forecast;
        }
        const liveIdealSintemp = Math.sin(((hourstep / 12) - 0.75) * Math.PI) * 10 + 15 + Math.sin(hourstep / 120 * Math.PI) * 2;
        const hourProviderData = new HourProviderData(new HourReading(liveIdealSintemp, hourstepToDate(hourstep)), forecasts);
        return hourProviderData;
    }
    private generateHourReferenceProviderData(hourstep: number): HourReferenceData {
        const liveIdealSintemp = Math.sin(((hourstep / 12) - 0.75) * Math.PI) * 10 + 15 + Math.sin(hourstep / 120 * Math.PI) * 2;
        const hourProviderData = new HourReferenceData(new HourReading(liveIdealSintemp, hourstepToDate(hourstep)));
        return hourProviderData;
    }
    private generateHourData(hourstep: number): HourData {
        return new HourData(
            {
                openWeather: this.generateHourProviderData(hourstep),
                foreca: this.generateHourProviderData(hourstep),
                yandex: this.generateHourProviderData(hourstep),
                gidromet: this.generateHourProviderData(hourstep),
            },
            this.generateHourReferenceProviderData(hourstep),
            hourstep
        );

    }
    public async getHourDatumBundle(): Promise<HourDatumBundle> {
        const fakeDatumLenght = 100;
        const fromHourstep = dateToHourstep(new Date()) - fakeDatumLenght + 1;
        const datum: HourData[] = [];
        for (let datumIdx = 0; datumIdx < fakeDatumLenght; datumIdx++) {
            const hourData = this.generateHourData(fromHourstep + datumIdx);
            datum[datumIdx] = hourData;
        }
        const hourDatumBundle = new HourDatumBundle(datum);
        return hourDatumBundle;
    }
}
