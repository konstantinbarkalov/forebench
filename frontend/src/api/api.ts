
import { dateToHourstep, hourstepToDate } from '../shared/frontend/chrono.js';
import { HourProviderData, HourForecast, HourReading, HourReferenceData, HourData, HourDatumBundle } from '../shared/frontend/datum.js';
import { AbstractApi } from './abstractApi.js';


export class Api extends AbstractApi {
    public async getHourDatumBundle(): Promise<HourDatumBundle> {
        const fetchResult = await fetch('/hourDatumBundle');
        const hourDatumBundlePlainTree = await fetchResult.json();
        const hourDatumBundle = HourDatumBundle.fromPlainTree(hourDatumBundlePlainTree);
        return hourDatumBundle;
    }
    public async getHourDatumBundleWithProgress(devLogContainer: HTMLElement): Promise<HourDatumBundle> {
        // Шаг 1: начинаем загрузку fetch, получаем поток для чтения
        const fetchResult = await fetch('/hourDatumBundle');
        const reader = fetchResult.body!.getReader();
        const contentLength = parseInt(fetchResult.headers.get('Content-Length')!);
        // Шаг 3: считываем данные:
        let receivedLength = 0; // количество байт, полученных на данный момент
        const chunks = []; // массив полученных двоичных фрагментов (составляющих тело ответа)
        while (true) {
            const {done, value} = await reader.read();
            if (done) {
                break;
            }
            if (value) {
                chunks.push(value);
                receivedLength += value.length;
                devLogContainer.innerText = `Получено ${receivedLength} из ${contentLength}`;
            }
        }

        // Шаг 4: соединим фрагменты в общий типизированный массив Uint8Array
        const allChunksWelded = new Uint8Array(receivedLength); // (4.1)
        let position = 0;
        for (let chunk of chunks) {
            allChunksWelded.set(chunk, position); // (4.2)
            position += chunk.length;
        }

        // Шаг 5: декодируем Uint8Array обратно в строку
        const jsonTextWelded = new TextDecoder("utf-8").decode(allChunksWelded);

        // Готово!
        const plainTree = JSON.parse(jsonTextWelded);
        const hourDatumBundle = HourDatumBundle.fromPlainTree(plainTree);
        return hourDatumBundle;
    }
}
