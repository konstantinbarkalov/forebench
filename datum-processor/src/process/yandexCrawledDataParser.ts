import { HourReading, HourForecast } from '../shared/frontend/datum';
import { YandexCrawledData } from '../shared/backend/udb/crawledData';
import { AbstractCrawledDataParser } from './abstractCrawledDataParser';

export class YandexCrawledDataParser extends AbstractCrawledDataParser<YandexCrawledData> {
  protected crawledForecastDataToActualDate(crawledForecastData: any): Date {
    const actualDate = new Date(crawledForecastData.hour_ts * 1000);
    return actualDate;
  }
  protected crawledDataToHourReading(crawledData: YandexCrawledData): HourReading {
    const temperature = crawledData.rawResponse.fact.temp;
    const actualDate = new Date(crawledData.rawResponse.now * 1000);
    const reading: HourReading = new HourReading(temperature, actualDate);
    return reading;
  }

  protected crawledDataToCrawledForecastDatum(crawledData: YandexCrawledData): any[] {
    const hours: any[] = crawledData.rawResponse.forecasts.reduce((hours: any[], forecast: any)=> {
      return hours.concat(forecast.hours);
    }, []);
    const crawledForecastDatum: any[] = hours;
    return crawledForecastDatum;
  }

  protected crawledForecastDataToHourForecast(crawledForecastData: any): HourForecast {
    const temperature = {
      min: crawledForecastData.temp,
      mean: crawledForecastData.temp,
      max: crawledForecastData.temp,
    }
    const actualDate = this.crawledForecastDataToActualDate(crawledForecastData);
    const forecast: HourForecast = new HourForecast(temperature, actualDate);
    return forecast;
  }
}