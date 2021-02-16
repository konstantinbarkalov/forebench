
import { ActiveTimestepBrick } from './brick/activeTimestepBrick/activeTimestepBrick.js';
import { ActiveTimestepBrickWidget } from './brick/activeTimestepBrick/activeTimestepBrickWidget.js';
import { ProviderBrick } from './brick/providerBrick/providerBrick.js';
import { TimestepBrick } from './brick/timestepBrick/timestepBrick.js';
import { ProviderBricksWidget } from './bricks/providerBricksWidget.js';
import { TimestepBricksWidget } from './bricks/timestepBricksWidget.js';
import { ChartDatumWidget, ChartDatum, ChartByProviderDatum, ChartPointSerialDatum } from './chartDatumWidget.js';
import { HourDatumBundle } from './shared/frontend/datum.js';
import { Api } from "./api/api.js";
import { hourDataToActiveTimestepBrick, hourDataToProviderBricks, hourDataToTimestepBricks, hourDatumToAnalysisChartDatum, hourDatumToOverviewChartDatum } from './todo.js';

class App {
    private api: Api = new Api();
    private timestepBricksWidget: TimestepBricksWidget;
    private activeTimestepBrickWidget: ActiveTimestepBrickWidget;
    private providerBricksWidget: ProviderBricksWidget;
    private chartDatumWidget: ChartDatumWidget;
    private chartDatumWidget2: ChartDatumWidget;
    private hourDatumBundle: HourDatumBundle | undefined;
    constructor(
        $timestepBricksContainer: HTMLElement,
        $activeTimestepBrickContainer: HTMLElement,
        $providerBricksContainer: HTMLElement,
        $chartDatumContainer: HTMLElement,
        $chartDatumContainer2: HTMLElement,
    ) {
        this.timestepBricksWidget = new TimestepBricksWidget($timestepBricksContainer);
        this.activeTimestepBrickWidget = new ActiveTimestepBrickWidget($activeTimestepBrickContainer);
        this.providerBricksWidget = new ProviderBricksWidget($providerBricksContainer);
        this.chartDatumWidget = new ChartDatumWidget($chartDatumContainer);
        this.chartDatumWidget2 = new ChartDatumWidget($chartDatumContainer2);
        this.timestepBricksWidget.ee.addEventListener('select', () => {
            this.onSelect(this.timestepBricksWidget.getSelected());
        })
    }
    public async init() {
        // await this.timestepBricksWidget.init();
        // await this.providerBricksWidget.init();
        // await this.activeTimestepBrickWidget.init();
        // await this.chartDatumWidget.init();
        // await this.chartDatumWidget2.init();
        // await this.api.init();
    }
    public async start() {
        const hourDatumBundle = await this.api.getHourDatumBundle();
        this.setHourDatumBundle(hourDatumBundle);
    }
    private setHourDatumBundle(hourDatumBundle: HourDatumBundle) {
        this.hourDatumBundle = hourDatumBundle;
        let timestepBricks: TimestepBrick[] = [];
        const lastHourData = this.hourDatumBundle.datum[this.hourDatumBundle.datum.length - 1];
        if (lastHourData) {
            timestepBricks = hourDataToTimestepBricks(lastHourData);
        } else {
            timestepBricks = [];
        }
        this.timestepBricksWidget.setBricks(timestepBricks);
        this.onSelect(0);
    }

    private onSelect(timestepBrickIdx: number) {
        let providerBricks: ProviderBrick[];
        let activeTimestepBrick: ActiveTimestepBrick | undefined;
        let overviewChartDatum: ChartDatum;
        let analysisChartDatum: ChartDatum;
        const lastHourData = this.hourDatumBundle!.datum[this.hourDatumBundle!.datum.length - 1];
        if (lastHourData) {
            providerBricks = hourDataToProviderBricks(lastHourData, timestepBrickIdx);
            activeTimestepBrick = hourDataToActiveTimestepBrick(lastHourData, timestepBrickIdx);
            overviewChartDatum = hourDatumToOverviewChartDatum(this.hourDatumBundle!.datum, timestepBrickIdx);
            analysisChartDatum = hourDatumToAnalysisChartDatum(this.hourDatumBundle!.datum, timestepBrickIdx);

        } else {
            providerBricks = [];
            activeTimestepBrick = undefined;
            const forecastByProvider = new ChartByProviderDatum(new ChartPointSerialDatum([], 0), new ChartPointSerialDatum([], 0), new ChartPointSerialDatum([], 0), new ChartPointSerialDatum([], 0));
            const readingByProvider = new ChartByProviderDatum(new ChartPointSerialDatum([], 0), new ChartPointSerialDatum([], 0), new ChartPointSerialDatum([], 0), new ChartPointSerialDatum([], 0));
            overviewChartDatum = new ChartDatum(readingByProvider, forecastByProvider, new ChartPointSerialDatum([], 0), 0,  0, 'C°');
            analysisChartDatum = new ChartDatum(readingByProvider, forecastByProvider, new ChartPointSerialDatum([], 0), 0,  0, 'C°');
        }
        this.providerBricksWidget.setBricks(providerBricks);
        if (activeTimestepBrick) {
            this.activeTimestepBrickWidget.setBrick(activeTimestepBrick);
        };
        this.chartDatumWidget.setChartDatum(overviewChartDatum);
        this.chartDatumWidget2.setChartDatum(analysisChartDatum);
        this.chartDatumWidget.setHothourstep(lastHourData.hourstep + timestepBrickIdx * 6);
        this.chartDatumWidget2.setHothourstep(lastHourData.hourstep + timestepBrickIdx * 6);
    }
}
const $timestepBricksContainer = document.getElementById('timestep-bricks-container');
const $activeTimestepBrickContainer = document.getElementById('active-timestep-brick-container');
const $providerBricksContainer = document.getElementById('provider-bricks-container');
const $chartDatumContainer = document.getElementById('chart-datum-container');
const $chartDatumContainer2 = document.getElementById('chart-datum-container2');

const app = new App($timestepBricksContainer!, $activeTimestepBrickContainer!, $providerBricksContainer!, $chartDatumContainer!, $chartDatumContainer2!);

console.log('hi, frontend!', app);
async function start() {
    await app.init();
    app.start();
}
start();

