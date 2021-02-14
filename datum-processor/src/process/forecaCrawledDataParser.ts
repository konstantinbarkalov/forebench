import { HourReading, HourForecast } from '../shared/frontend/datum';
import { ForecaCrawledData } from '../shared/backend/udb/crawledData';
import { AbstractCrawledDataParser } from './abstractCrawledDataParser';

export class ForecaCrawledDataParser extends AbstractCrawledDataParser<ForecaCrawledData> {
  protected crawledDataToHourReading(crawledData: ForecaCrawledData): HourReading {
    const temperature = crawledData.weatherRawResponse.current.temperature;
    const actualDate = new Date(crawledData.weatherRawResponse.current.time);
    const reading: HourReading = new HourReading(temperature, actualDate);
    return reading;
  }

  protected crawledDataToCrawledForecastDatum(crawledData: ForecaCrawledData): any[] {
    const crawledForecastDatum: any[] = crawledData.forecastRawResponse.forecast;
    return crawledForecastDatum;
  }

  protected crawledForecastDataToHourForecast(crawledForecastData: any): HourForecast {
    const temperature = {
      min: crawledForecastData.temperature,
      mean: crawledForecastData.temperature,
      max: crawledForecastData.temperature,
    }
    const actualDate = new Date(crawledForecastData.time);
    const forecast: HourForecast = new HourForecast(temperature, actualDate);
    return forecast;
  }
}