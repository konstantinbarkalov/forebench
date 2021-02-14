export type AbstractCrawledDataT = {
  crawledTimestamp: number;
  weatherRawResponse?: any,
  forecastRawResponse?: any
}
export class OpenWeatherCrawledData implements AbstractCrawledDataT {
  constructor(public crawledTimestamp: number,
              public weatherRawResponse: any,
              public forecastRawResponse: any) {
  }
};

export class ForecaCrawledData implements AbstractCrawledDataT {
  constructor(public crawledTimestamp: number,
              public weatherRawResponse: any,
              public forecastRawResponse: any) {
}
};

export class YandexCrawledData implements AbstractCrawledDataT {
  constructor(public crawledTimestamp: number,
              public rawResponse: any) {
  }
};


export class GidrometCrawledData implements AbstractCrawledDataT {
  constructor(public crawledTimestamp: number,
              public rawResponse: any) {
  }
};
