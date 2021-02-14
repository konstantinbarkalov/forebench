import fs from 'fs';

import { alignToHourstep } from './alignToHourstep';
import { AbstractCrawledDataParser } from './process/abstractCrawledDataParser';
import { ForecaCrawledDataParser } from './process/forecaCrawledDataParser';
import { dateToHourstep, hourstepToDate } from './shared/frontend/chrono';
import { ByProviderT, HourData, HourDatumBundle, HourProviderData, HourReading, HourReferenceData } from './shared/frontend/datum';
import { Pretty } from './shared/frontend/pretty';
import { AbstractCrawledDataT, ForecaCrawledData, GidrometCrawledData, OpenWeatherCrawledData, YandexCrawledData } from './shared/backend/udb/crawledData';
import { KeyUdb, Udb, UdbKeymap } from './shared/backend/udb/udb';
import { YandexCrawledDataParser } from './process/yandexCrawledDataParser';
import { OpenWeatherCrawledDataParser } from './process/openWeatherCrawledDataParser';
import { GidrometCrawledDataParser } from './process/gidrometCrawledDataParser';
type measureT = {firstDate: Date, lastDate: Date}

class App {
  private udb: Udb = new Udb({
    openWeatherCrawledData: new KeyUdb<OpenWeatherCrawledData>('src/shared/backend/udb/storage', 'openWeatherCrawledData'),
    forecaCrawledData: new KeyUdb<ForecaCrawledData>('src/shared/backend/udb/storage', 'forecaCrawledData'),
    yandexCrawledData: new KeyUdb<YandexCrawledData>('src/shared/backend/udb/storage', 'yandexCrawledData'),
    gidrometCrawledData: new KeyUdb<GidrometCrawledData>('src/shared/backend/udb/storage', 'gidrometCrawledData'),
  });
  private parser = {
    openWeather: new OpenWeatherCrawledDataParser(),
    foreca: new ForecaCrawledDataParser(),
    yandex: new YandexCrawledDataParser(),
    gidromet: new GidrometCrawledDataParser(),
  };
  private maxHistoryHourstepsCount:number = 168;
  private maxForecastHourstepsCount:number = 168;
  public async init(): Promise<void> {
    console.info('app init started...');
    await this.udb.init(false);
    this.udb.reloadFromDisk();
    console.info('app init done!');
  }
  public measureAndLog(): {wideMeasure: measureT, narrowMeasure: measureT} {
    const measures = [
      this.measureAndLogKeymap('openWeatherCrawledData', this.udb.keymap.openWeatherCrawledData),
      this.measureAndLogKeymap('forecaCrawledData', this.udb.keymap.forecaCrawledData),
      this.measureAndLogKeymap('yandexCrawledData', this.udb.keymap.yandexCrawledData),
      this.measureAndLogKeymap('gidrometCrawledData', this.udb.keymap.gidrometCrawledData),
    ];
    const wideMeasure: measureT = measures.reduce((wideMeasure, measure) => {
      return {
        firstDate: new Date(Math.min(measure.firstDate.valueOf(), wideMeasure.firstDate.valueOf())),
        lastDate: new Date(Math.max(measure.lastDate.valueOf(), wideMeasure.lastDate.valueOf())),
      }
    }, {firstDate: measures[0]!.firstDate, lastDate: measures[0]!.lastDate});

    const narrowMeasure: measureT = measures.reduce((narrowMeasure, measure) => {
      return {
        firstDate: new Date(Math.max(measure.firstDate.valueOf(), narrowMeasure.firstDate.valueOf())),
        lastDate: new Date(Math.min(measure.lastDate.valueOf(), narrowMeasure.lastDate.valueOf())),
      }
    }, {firstDate: measures[0]!.firstDate, lastDate: measures[0]!.lastDate});
    return {wideMeasure, narrowMeasure};
  }
  public measureAndLogKeymap(key: keyof UdbKeymap, keyUdb: KeyUdb<AbstractCrawledDataT>): measureT {
    const length = keyUdb.getLength();
    const first = keyUdb.getValue(0);
    const last = keyUdb.getValue(length - 1);
    let firstDate = new Date(first!.crawledTimestamp);
    let lastDate = new Date(last!.crawledTimestamp);
    if (first && last) {
      console.log(`keyUdb ${key}: ${Pretty.datetime(new Date(firstDate))} - ${Pretty.datetime(new Date(lastDate))} (${length})`);
    } else {
      console.log(`keyUdb ${key}: BAD!`);
    }
    return {firstDate, lastDate};
  }

  public renderHourDatumBundle(): HourDatumBundle {
    const measure = app.measureAndLog();
    const now = new Date();
    const nowHourstep = dateToHourstep(now);
    const maxToHourstep = nowHourstep + 1;
    const minFromHourstep = maxToHourstep - this.maxHistoryHourstepsCount;
    const measuredToHourstep = dateToHourstep(measure.wideMeasure.lastDate) + 1;
    const measuredFromHourstep = dateToHourstep(measure.wideMeasure.firstDate);
    const toHourstep = Math.min(maxToHourstep, measuredToHourstep);
    const fromHourstep = Math.max(minFromHourstep, measuredFromHourstep);

    const openWeatherCrawledDatum = this.udb.keymap.openWeatherCrawledData.getAllValues();
    const openWeatherProviderDatum = this.crawledDatumToProviderDatum(openWeatherCrawledDatum, fromHourstep, toHourstep, this.parser.openWeather);

    const forecaCrawledDatum = this.udb.keymap.forecaCrawledData.getAllValues();
    const forecaProviderDatum = this.crawledDatumToProviderDatum(forecaCrawledDatum, fromHourstep, toHourstep, this.parser.foreca);

    const yandexCrawledDatum = this.udb.keymap.yandexCrawledData.getAllValues();
    const yandexProviderDatum = this.crawledDatumToProviderDatum(yandexCrawledDatum, fromHourstep, toHourstep, this.parser.yandex);

    const gidrometCrawledDatum = this.udb.keymap.gidrometCrawledData.getAllValues();
    const gidrometProviderDatum = this.crawledDatumToProviderDatum(gidrometCrawledDatum, fromHourstep, toHourstep, this.parser.gidromet);

    const hourDatum: HourData[] = [];
    const historyDim = forecaProviderDatum.length;
    for (let hourstepIdx = 0; hourstepIdx < historyDim; hourstepIdx++) {
      const byProvider: ByProviderT<HourProviderData> = {
        openWeather: openWeatherProviderDatum[hourstepIdx]!,
        foreca: forecaProviderDatum[hourstepIdx]!,
        yandex: yandexProviderDatum[hourstepIdx]!,
        gidromet: gidrometProviderDatum[hourstepIdx]!,
      };
      const hourstep = fromHourstep + hourstepIdx;
      const referenceDate = hourstepToDate(hourstep);
      const referenceValue = (byProvider.openWeather.reading.temperature +
                              byProvider.foreca.reading.temperature +
                              byProvider.yandex.reading.temperature +
                              byProvider.gidromet.reading.temperature) / 4;

      const refereceReading = new HourReading(referenceValue, referenceDate);
      const referece: HourReferenceData = new HourReferenceData(refereceReading);
      hourDatum[hourstepIdx] = new HourData(byProvider, referece, fromHourstep + hourstepIdx);
    }
    const hourDatumBundle: HourDatumBundle = new HourDatumBundle(hourDatum);
    return hourDatumBundle;

  }

  public crawledDatumToProviderDatum<CrawledDataG extends AbstractCrawledDataT>(crawledDatum: CrawledDataG[], fromHourstep: number, toHourstep: number, parser: AbstractCrawledDataParser<CrawledDataG>): HourProviderData[] {
    const alingedForecaCrawledDatum = alignToHourstep(crawledDatum, fromHourstep, toHourstep, (value) => {
      return new Date(value.crawledTimestamp);
    }, (hourstep: number, date: Date) => {
      const hourstepRoundDate = hourstepToDate(hourstep);
      const diff = hourstepRoundDate.valueOf() - date.valueOf() + 1000 * 60 * 30; // sweetpoint is +30 minutes
      if (diff >= 0) {
        return diff;
      } else {
        return Infinity;
      }
    });
    const alingedForecaHourProviderDatum = alingedForecaCrawledDatum.map(crawledData => parser.crawledDataToHourProviderData(crawledData, this.maxForecastHourstepsCount));
    console.log(alingedForecaHourProviderDatum);
    return alingedForecaHourProviderDatum;
  }
}
const app = new App();
async function start() {
  await app.init();
  const hourDatumBundle = app.renderHourDatumBundle();
  const hourDatumBundlePlainTree = hourDatumBundle.toPlainTree();
  const json = JSON.stringify(hourDatumBundlePlainTree, null, 2);
  fs.writeFileSync('./src/shared/backend/json-file-db/hourDatumBundle.json', json);
}
start();