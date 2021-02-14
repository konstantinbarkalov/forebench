import { HourDatumBundle } from '../shared/frontend/datum.js';


export abstract class AbstractApi {
    public abstract getHourDatumBundle(): Promise<HourDatumBundle>;
}
