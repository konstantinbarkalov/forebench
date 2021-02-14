import { HourReading, HourForecast } from '../shared/frontend/datum';
import { OpenWeatherCrawledData } from '../shared/backend/udb/crawledData';
import { AbstractCrawledDataParser } from './abstractCrawledDataParser';

export class OpenWeatherCrawledDataParser extends AbstractCrawledDataParser<OpenWeatherCrawledData> {
  protected crawledDataToHourReading(crawledData: OpenWeatherCrawledData): HourReading {
    const kelvinShift = -273.15;
    const temperature = crawledData.weatherRawResponse.main.temp + kelvinShift;
    const actualDate = new Date(crawledData.weatherRawResponse.dt * 1000);
    const reading: HourReading = new HourReading(temperature, actualDate);
    return reading;
  }

  protected crawledDataToCrawledForecastDatum(crawledData: OpenWeatherCrawledData): any[] {
    const crawledForecastDatum: any[] = crawledData.forecastRawResponse.list;
    return crawledForecastDatum;
  }

  protected crawledForecastDataToHourForecast(crawledForecastData: any): HourForecast {
    const kelvinShift = -273.15;
    const temperature = {
      min: crawledForecastData.main.temp_min + kelvinShift,
      mean: crawledForecastData.main.temp + kelvinShift,
      max: crawledForecastData.main.temp_max + kelvinShift,
    }
    const actualDate = new Date(crawledForecastData.dt * 1000);
    const forecast: HourForecast = new HourForecast(temperature, actualDate);
    return forecast;
  }
}