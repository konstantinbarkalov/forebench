import { HourReading, HourForecast } from '../shared/frontend/datum';
import { GidrometCrawledData } from '../shared/backend/udb/crawledData';
import { AbstractCrawledDataParser } from './abstractCrawledDataParser';

export class GidrometCrawledDataParser extends AbstractCrawledDataParser<GidrometCrawledData> {
  protected jsCodeToData(jsCode: string): any {
    const wrappedJsCode = 'var jsData = []; ' +
        jsCode.replaceAll(/(arr_.[a-z_]+)=/g,'jsData.$1=') +
        '; return jsData;';
    const unsafeFn = new Function(wrappedJsCode);
    const jsData = unsafeFn();
    return jsData;
  }
  protected crawledDataToHourReading(crawledData: GidrometCrawledData): HourReading {
    const jsCode = crawledData.rawResponse;
    const jsData = this.jsCodeToData(jsCode);
    const firstSample = jsData.arr_temperature[0];
    const temperature = firstSample.y;
    const actualDate = new Date(firstSample.x);
    const reading: HourReading = new HourReading(temperature, actualDate);
    return reading;
  }

  protected crawledDataToCrawledForecastDatum(crawledData: GidrometCrawledData): any[] {
    const jsCode = crawledData.rawResponse;
    const jsData = this.jsCodeToData(jsCode);
    const crawledForecastDatum: any[] = jsData.arr_temperature;
    return crawledForecastDatum;
  }

  protected crawledForecastDataToHourForecast(crawledForecastData: any): HourForecast {
    const temperature = {
      min: crawledForecastData.y,
      mean: crawledForecastData.y,
      max: crawledForecastData.y,
    }
    const actualDate = new Date(crawledForecastData.x);
    const forecast: HourForecast = new HourForecast(temperature, actualDate);
    return forecast;
  }
}