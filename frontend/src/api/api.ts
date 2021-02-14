
import { dateToHourstep, hourstepToDate } from '../shared/frontend/chrono.js';
import { HourProviderData, HourForecast, HourReading, HourReferenceData, HourData, HourDatumBundle } from '../shared/frontend/datum.js';
import { AbstractApi } from './abstractApi.js';


export class Api extends AbstractApi {
    public async getHourDatumBundle(): Promise<HourDatumBundle> {
        const fetchResult = await fetch('/hourDatumBundle');
        const hourDatumBundlePlainTree = await fetchResult.json();
        const hourDatumBundle = HourDatumBundle.fromPlainTree(hourDatumBundlePlainTree);
        return hourDatumBundle;
    }
}
