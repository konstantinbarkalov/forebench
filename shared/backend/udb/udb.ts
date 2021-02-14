import fs from 'fs';
import path from 'path';
import { OpenWeatherCrawledData, ForecaCrawledData, GidrometCrawledData, YandexCrawledData } from './crawledData';

export type keyDatumT<valueG> = valueG[];
export type datumT<valueG> = {[key: string]: keyDatumT<valueG>};
export class UnknownKeyError extends Error { };
export class FileError extends Error { };
export class KeyUdb<valueG> {
  private keyDatum: keyDatumT<valueG> = [];
  private timeout: NodeJS.Timeout | null = null;
  constructor(private persistDirPath: string, private persistFileName: string) {

  }
  public init(isAutoPersist: boolean = true): void {
    console.info('key-udb init started...');
    //this.reloadFromDisk();
    //const delayMinutes = 30;
    if (this.timeout) {
      clearInterval(this.timeout);
    }
    if (isAutoPersist) {
      this.timeout = setInterval(() => {
        this.persistToDisk();
      //}, 1000 * 60 * delayMinutes);
      }, 5000);
    }
    console.info('key-udb init done!');
  }

  public getValue(idx: number): valueG | undefined {
    return this.keyDatum[idx];
  }
  public getAllValues(): valueG[] {
    return this.keyDatum.slice();
  }

  public setValue(idx: number, value: valueG): void {
    this.keyDatum[idx] = value;
  }

  public addValue(value: valueG): number {
    const newIdx = this.keyDatum.length;
    this.setValue(newIdx, value);
    return newIdx;
  }

  public getLength(): number {
    return this.keyDatum.length;
  }

  public persistToDisk(): void {
    const keyFileData = JSON.stringify(this.keyDatum);
    const persistKeyFilePath = path.join(this.persistDirPath, this.persistFileName + '.lazydata');
    try {
      fs.writeFileSync(persistKeyFilePath, keyFileData);
    } catch (err) {
      if (err.code === 'EISDIR') {
        console.log('no dir found, creating');
        fs.mkdirSync(this.persistDirPath, {recursive: true});
        fs.writeFileSync(persistKeyFilePath, keyFileData);
        return;
      } else {
        throw err;
      }
    }
  }

  public reloadFromDisk() {
    const persistKeyFilePath = path.join(this.persistDirPath, this.persistFileName + '.lazydata');
    let keyFileData;
    try {
      keyFileData = fs.readFileSync(persistKeyFilePath, {encoding: 'utf8'});
    } catch (err) {
      if (err.code === 'ENOENT' || err.code === 'EISDIR') {
        console.log('no file found, initing key-udb with empty array');
        this.keyDatum = [];
        return;
      } else {
        throw err;
      }
    }
    if (!keyFileData) {
      console.log('empty file found, initing key-udb with empty array');
      this.keyDatum = [];
    } else {
      this.keyDatum = JSON.parse(keyFileData) as keyDatumT<valueG>;
    }
  }
}

export type UdbKeymap = {
  openWeatherCrawledData: KeyUdb<OpenWeatherCrawledData>,
  forecaCrawledData: KeyUdb<ForecaCrawledData>,
  yandexCrawledData: KeyUdb<YandexCrawledData>,
  gidrometCrawledData: KeyUdb<GidrometCrawledData>,
}

export class Udb {
  constructor(public keymap: UdbKeymap) {

  }
  public init(isAutoPersist: boolean = true): void {
    console.info('udb init started...');
    const values = Object.values(this.keymap);
    values.forEach((keyUdb) => {
      keyUdb.init(isAutoPersist);
    });
    console.info('udb init done!');
  }
  public persistToDisk(): void {
    const values = Object.values(this.keymap);
    values.forEach((keyUdb) => {
      keyUdb.persistToDisk();
    });
  }
  public reloadFromDisk() {
    const values = Object.values(this.keymap);
    values.forEach((keyUdb) => {
      keyUdb.reloadFromDisk();
    });
  }

}

