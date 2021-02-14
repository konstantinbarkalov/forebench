import { alignToHourstep } from '../alignToHourstep';
import { dateToHourstep, hourstepToDate } from '../shared/frontend/chrono';
import { HourReading, HourForecast, HourProviderData } from '../shared/frontend/datum';
import { AbstractCrawledDataT } from '../shared/backend/udb/crawledData';
export abstract class AbstractCrawledDataParser<CrawledDataG extends AbstractCrawledDataT> {
  protected abstract crawledDataToHourReading(crawledData: CrawledDataG): HourReading;
  protected abstract crawledForecastDataToHourForecast(crawledForecastData: any): HourForecast;
  protected abstract crawledDataToCrawledForecastDatum(crawledData: CrawledDataG): any[];

  protected crawledDataToForecasts(crawledData: CrawledDataG, hourstep: number, maxForecastHourstepsCount: number): HourForecast[] {
    const crawledForecastDatum = this.crawledDataToCrawledForecastDatum(crawledData);
    const forecasts = crawledForecastDatum.map(crawledForecastData => this.crawledForecastDataToHourForecast(crawledForecastData));
    const fromHourstep = hourstep + 1;
    const toHourstep = fromHourstep + maxForecastHourstepsCount + 1;

    const alingedForecasts = alignToHourstep(forecasts, fromHourstep, toHourstep, (forecast) => {
      return forecast.actualDate;
    }, (hourstep: number, date: Date) => {
      const hourstepRoundDate = hourstepToDate(hourstep);
      return Math.abs(hourstepRoundDate.valueOf() - date.valueOf() + 1000 * 60 * 30);
    });
    return alingedForecasts;
  }


  public crawledDataToHourProviderData(crawledData: CrawledDataG, maxForecastHourstepsCount: number): HourProviderData {
    const reading: HourReading = this.crawledDataToHourReading(crawledData);
    const hourstep: number = dateToHourstep(reading.actualDate);
    const forecasts: HourForecast[] = this.crawledDataToForecasts(crawledData, hourstep, maxForecastHourstepsCount);
    const hourProviderData = new HourProviderData(reading, forecasts);
    return hourProviderData;
  }
}