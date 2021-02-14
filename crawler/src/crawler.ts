import { AbstractAlignedAutoCrawler } from './abstractCrawler';
import fetch from 'node-fetch';
import { Secret } from './secret';
import { OpenWeatherCrawledData, ForecaCrawledData, YandexCrawledData, GidrometCrawledData } from './shared/backend/udb/crawledData';


export class OpenWeatherCrawler extends AbstractAlignedAutoCrawler<OpenWeatherCrawledData> {
  public async init(): Promise<void> {
    super.init();
    console.info('openWeather crawler init started...');
    console.info('openWeather crawler init done!');
  }
  public async crawlWeather(): Promise<any> {
    console.info('openWeather crawl weather started...');
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${Secret.geoCoords.lat}&lon=${Secret.geoCoords.lon}&appid=${Secret.openWeaterApiKey}`);
    const json = await response.json();
    console.info('openWeather crawl weather done!');
    return json;
  }
  public async crawlForecast(): Promise<any> {
    console.info('openWeather crawl forecast started...');
    const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${Secret.geoCoords.lat}&lon=${Secret.geoCoords.lon}&appid=${Secret.openWeaterApiKey}`);
    const json = await response.json();
    console.info('openWeather crawl forecast done!');
    return json;
  }
  public async crawl(): Promise<OpenWeatherCrawledData> {
    const weatherRawResponse = await this.crawlWeather();
    const forecastRawResponse = await this.crawlForecast();
    return { crawledTimestamp: Date.now(), weatherRawResponse, forecastRawResponse};
  }
}

export class ForecaCrawler extends AbstractAlignedAutoCrawler<ForecaCrawledData> {
  public async init(): Promise<void> {
    super.init();
    console.info('foreca crawler init started...');
    console.info('foreca crawler init done!');
  }
  public async crawlToken(): Promise<string> {
    console.info('foreca crawl token started...');
    {
      const params = {user: Secret.forecaUser, password: Secret.forecaPassword};
      const response = await fetch(`https://pfa.foreca.com/authorize/token`, {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)});
      const json = await response.json();
      const token: string = json.access_token;
      return token;
    }
  }


  public async crawlWeather(token: string): Promise<any> {
    console.info('openWeather crawl weather started...');
    const response = await fetch(`https://pfa.foreca.com//api/v1/current/${Secret.geoCoords.lon},${Secret.geoCoords.lat}&token=${token}`);
    const json = await response.json();
    console.info('openWeather crawl weather done!');
    return json;
  }
  public async crawlForecast(token: string): Promise<any> {
    console.info('openWeather crawl forecast started...');
    const periodsCount: number = 168; // max is 168
    const response = await fetch(`https://pfa.foreca.com//api/v1/forecast/hourly/${Secret.geoCoords.lon},${Secret.geoCoords.lat}&periods=${periodsCount}&token=${token}`);
    const json = await response.json();
    console.info('openWeather crawl forecast done!');
    return json;
  }

  public async crawl(): Promise<ForecaCrawledData> {
    const token = await this.crawlToken();
    const forecastRawResponse = await this.crawlForecast(token);
    const weatherRawResponse = await this.crawlWeather(token);
    return {crawledTimestamp: Date.now(), forecastRawResponse, weatherRawResponse};
  }

}

export class YandexCrawler extends AbstractAlignedAutoCrawler<YandexCrawledData> {
  public async init(): Promise<void> {
    super.init();
    console.info('yandex crawler init started...');
    console.info('yandex crawler init done!');
  }

  public async crawl(): Promise<YandexCrawledData> {
    //const cityName = 'krasnoyarsk';
    //const response = await fetch(`https://api.weather.yandex.ru/v2/informers?lat=55.75396&lon=37.620393`, { headers: {
      console.info('yandex crawler crawl started...');
      const response = await fetch(`https://api.weather.yandex.ru/v2/forecast?lat=${Secret.geoCoords.lat}&lon=${Secret.geoCoords.lon}`, { headers: {
      'X-Yandex-API-Key': Secret.yandexApiKey,
    }});
    const json = await response.json();
    console.info('yandex crawler crawl done!');
    return { crawledTimestamp: Date.now(), rawResponse: json};
  }
}


export class GidrometCrawler extends AbstractAlignedAutoCrawler<GidrometCrawledData> {
  public async init(): Promise<void> {
    super.init();
    console.info('gidromet crawler init started...');
    console.info('gidromet crawler init done!');
  }
  private parseMeteoinfoHtmlToCode(html: string): string {
    const startPos = html.indexOf('arr_temperature=[{');
    //const endPos = html.indexOf('arr_wind_dir=[{');
    const endPos = html.indexOf('Highcharts.setOptions({');
    const code = html.slice(startPos, endPos);
    return code;

  }

  public async crawl(): Promise<GidrometCrawledData> {
    console.info('gidromet crawler crawl started...');
    const response = await fetch(`https://meteoinfo.ru/forecasts/russia/krasnoyarsk-territory/krasnojarsk`);
    const text = await response.text();
    const code = this.parseMeteoinfoHtmlToCode(text);
    console.info('gidromet crawler crawl done!');
    return { crawledTimestamp: Date.now(), rawResponse: code};
  }
}