import { ByProviderT, providerKeyT } from './shared/frontend/datum.js';
import { Mmm } from './mmm.js';
import { Pretty } from './shared/frontend/pretty.js';
import { hourstepToDate, dateToQuaterdaystep, quaterdaystepToDate, dateToHourstep } from './shared/frontend/chrono.js';
import { positionT, sizeT, clampLocalPosition, remapFnT, providerColors, rgbaT, rgbaToHtmlColor, dimColor, quaterdayColors } from './todo.js';

export class ChartPointData {
    constructor (
        public value: Mmm,
    ) {
    }

}
export class ChartByProviderDatum implements ByProviderT<ChartPointData[]> {
    constructor (
        public openWeather: ChartPointData[],
        public foreca: ChartPointData[],
        public yandex: ChartPointData[],
        public gidromet: ChartPointData[],
    ) {

    }

}

export class ChartDatum {
    constructor (
        public byProvider: ChartByProviderDatum,
        public reference: ChartPointData[],
        public maxLength: number,
        public firstHourstep: number,
        public unit: string,
    ) {

    }

}
export class ChartDatumWidget {
    constructor(protected $container: HTMLElement, protected cssPrefix:string = 'chart-datum') {
        this.buildDom();
    }
    protected $root?: HTMLElement;
    protected $canvas?: HTMLCanvasElement;
    protected ctx?: CanvasRenderingContext2D;
    protected retinaSize: {width: number, height: number} = {width: 0, height: 0};
    protected virtualSize: {width: number, height: number} = {width: 0, height: 0};
    protected xRullerSize: number = 32;
    protected yRullerSize: number = 80;
    protected outerMargin: number = 32;
    protected innerMargin: number = 8;
    protected chartDatum?: ChartDatum;
    protected hotPointChartPosition: positionT =  {x: 1, y: 0.5};
    protected datumBounds: {x: {min: number, max: number, width: number}, y: {min: number, max: number, height: number}} = {
        x: {
            min: 0,
            max: 0,
            width: 0,
        },
        y: {
            min: 0,
            max: 0,
            height: 0,
        }
    };
    protected globalCoords: {
        xRullerGlobalSize: sizeT,
        yRullerGlobalSize: sizeT,
        chartGlobalSize: sizeT,
        chartTopLeftGlobalPosition: positionT,
        xRullerTopLeftGlobalPosition: positionT,
        yRullerTopLeftGlobalPosition: positionT
    } = {
        xRullerGlobalSize: {width: 0, height: 0},
        yRullerGlobalSize: {width: 0, height: 0},
        chartGlobalSize: {width: 0, height: 0},
        chartTopLeftGlobalPosition: {x: 0, y: 0},
        xRullerTopLeftGlobalPosition: {x: 0, y: 0},
        yRullerTopLeftGlobalPosition: {x: 0, y: 0}
    };
    public ee: EventTarget = new EventTarget();
    public setChartDatum(chartDatum: ChartDatum) {
        this.chartDatum = chartDatum;
        this.recalcDatumBounds();
        this.redraw();
    }
    protected recalcDatumBounds() {
        this.datumBounds = {
            x: {
                min: Infinity,
                max: -Infinity,
                width: 0,
            },
            y: {
                min: Infinity,
                max: -Infinity,
                height: 0,
            }
        }
        if (this.chartDatum) {
            const byProvider: ByProviderT<ChartPointData[]> = this.chartDatum.byProvider;
            type keyT = 'minValue' | 'meanValue' | 'maxValue';
            var keys: keyT[] = ['minValue','meanValue', 'maxValue']
            Object.values(byProvider).forEach(chartPoints => {
                chartPoints.forEach(chartPoint => {
                    keys.forEach(key => {
                        const value = chartPoint.value[key];
                        if (value !== undefined) {
                            this.datumBounds.y.min = Math.min(this.datumBounds.y.min, value);
                            this.datumBounds.y.max = Math.max(this.datumBounds.y.max, value);
                        }
                    })
                })
            })
            this.chartDatum!.reference.forEach(chartPoint => {
                keys.forEach(key => {
                    const value = chartPoint.value[key];
                    if (value !== undefined) {
                        this.datumBounds.y.min = Math.min(this.datumBounds.y.min, value);
                        this.datumBounds.y.max = Math.max(this.datumBounds.y.max, value);
                    }
                });
            });
            this.datumBounds.x.min = this.chartDatum.firstHourstep;
            this.datumBounds.x.max = this.chartDatum.firstHourstep + this.chartDatum.maxLength - 1;
            this.datumBounds.x.width = this.datumBounds.x.max - this.datumBounds.x.min;
            this.datumBounds.y.height = this.datumBounds.y.max - this.datumBounds.y.min;

        }

    }
    protected recalcGlobalCoords() {
        const xRullerGlobalSize = {
            width: this.retinaSize.width - this.outerMargin * 2 - this.innerMargin * 1 - this.yRullerSize,
            height: this.xRullerSize,
        }
        const yRullerGlobalSize = {
            width: this.yRullerSize,
            height: this.retinaSize.height - this.outerMargin * 2 - this.innerMargin * 1 - this.xRullerSize,
        }
        const chartGlobalSize = {
            width: this.retinaSize.width - this.outerMargin * 2 - this.innerMargin * 1 - yRullerGlobalSize.width,
            height: this.retinaSize.height - this.outerMargin * 2 - this.innerMargin * 1 - xRullerGlobalSize.height,
        }
        const chartTopLeftGlobalPosition = {
            x: this.outerMargin * 1,
            y: this.outerMargin * 1,
        }
        const xRullerTopLeftGlobalPosition = {
            x: this.outerMargin * 1,
            y: this.outerMargin * 1 + this.innerMargin * 1 + chartGlobalSize.height,
        }
        const yRullerTopLeftGlobalPosition = {
            x: this.outerMargin * 1 + this.innerMargin * 1 + chartGlobalSize.width,
            y: this.outerMargin * 1,
        }
        this.globalCoords = {
            xRullerGlobalSize,
            yRullerGlobalSize,
            chartGlobalSize,
            chartTopLeftGlobalPosition,
            xRullerTopLeftGlobalPosition,
            yRullerTopLeftGlobalPosition
        }
    }
    protected remap = {
        chartToGlobal: (chartPosition: positionT) => {
            const globalPosition = {
                x: this.globalCoords.chartTopLeftGlobalPosition.x + chartPosition.x * this.globalCoords.chartGlobalSize.width,
                y: this.globalCoords.chartTopLeftGlobalPosition.y + (1 - chartPosition.y) * this.globalCoords.chartGlobalSize.height,
            }
            return globalPosition;
        },
        xRullerToGlobal: (xRullerPosition: positionT) => {
            const globalPosition = {
                x: this.globalCoords.xRullerTopLeftGlobalPosition.x + xRullerPosition.x * this.globalCoords.xRullerGlobalSize.width,
                y: this.globalCoords.xRullerTopLeftGlobalPosition.y + (1 - xRullerPosition.y) * this.globalCoords.xRullerGlobalSize.height,
            }
            return globalPosition;
        },
        yRullerToGlobal: (yRullerPosition: positionT) => {
            const globalPosition = {
                x: this.globalCoords.yRullerTopLeftGlobalPosition.x + yRullerPosition.x * this.globalCoords.yRullerGlobalSize.width,
                y: this.globalCoords.yRullerTopLeftGlobalPosition.y + (1 - yRullerPosition.y) * this.globalCoords.yRullerGlobalSize.height,
            }
            return globalPosition;
        },
        globalToChart: (globalPosition: positionT) => {
            const chartPosition = {
                x: (globalPosition.x - this.globalCoords.chartTopLeftGlobalPosition.x) / this.globalCoords.chartGlobalSize.width,
                y: 1 - (globalPosition.y - this.globalCoords.chartTopLeftGlobalPosition.y) / this.globalCoords.chartGlobalSize.height,
            }
            return chartPosition;
        },
        datumToLocal: (datumPosition: positionT) => {

            const localPosition = {
                x: (datumPosition.x - this.datumBounds.x.min) / this.datumBounds.x.width,
                y: (datumPosition.y - this.datumBounds.y.min) / this.datumBounds.y.height,
            }
            return localPosition;
        }
    }
    protected buildDom() {
        this.$root = document.createElement('div');
        this.$root.classList.add(this.cssPrefix);
        this.$canvas = document.createElement('canvas');
        this.$canvas.classList.add(this.cssPrefix + '-canvas');
        this.ctx = this.$canvas.getContext('2d') || undefined;
        this.$root.appendChild(this.$canvas);
        this.$container.appendChild(this.$root);
        window.addEventListener('resize', () => {
            this.onDomResize();
        });
        this.$canvas.addEventListener('mousemove', (e) => {
            const globalPosition = {
                x: e.offsetX * window.devicePixelRatio,
                y: e.offsetY * window.devicePixelRatio
            }
            this.setHotpoint(globalPosition);
        });
        setTimeout(()=>{
            this.onDomResize(); // this.redraw(); inside
        }, 0);

    }
    protected onDomResize() {
        this.retinaSize = {
            width: this.$root!.clientWidth * window.devicePixelRatio,
            height: this.$root!.clientHeight * window.devicePixelRatio,
        }
        this.virtualSize = {
            width: this.$root!.clientWidth,
            height: this.$root!.clientHeight,
        }

        const intRetinaSize = {
            width: Math.floor(this.retinaSize.width),
            height: Math.floor(this.retinaSize.height),
        }

        const intishVirtualSize = {
            width: (intRetinaSize.width / window.devicePixelRatio),
            height: (intRetinaSize.height / window.devicePixelRatio),
        }

        this.$canvas!.width = intRetinaSize.width;
        this.$canvas!.height = intRetinaSize.height;
        this.$canvas!.style.width = intishVirtualSize + 'px';
        this.$canvas!.style.height = intishVirtualSize + 'px';
        this.recalcGlobalCoords();
        this.redraw();
    }
    protected setHotpoint(globalPosition: positionT) {
        this.hotPointChartPosition = clampLocalPosition(this.remap.globalToChart(globalPosition));
        this.redraw();
    }
    protected drawBoundingBox(mappingToGlobal: remapFnT): void {
        { // box
            this.ctx!.save();
            this.ctx!.strokeStyle = '1px #000';
            this.ctx!.globalAlpha = 0.2;
            const point1 = mappingToGlobal({x: 0, y: 0});
            const point2 = mappingToGlobal({x: 0, y: 1});
            const point3 = mappingToGlobal({x: 1, y: 1});
            const point4 = mappingToGlobal({x: 1, y: 0});
            this.ctx!.beginPath();
            this.ctx!.moveTo(point1.x, point1.y);
            this.ctx!.lineTo(point2.x, point2.y);
            this.ctx!.lineTo(point3.x, point3.y);
            this.ctx!.lineTo(point4.x, point4.y);
            this.ctx!.lineTo(point1.x, point1.y);
            this.ctx!.stroke();
            this.ctx!.restore();
        }
        { // top arrow
            this.ctx!.save();
            this.ctx!.strokeStyle = '1px #000';
            this.ctx!.globalAlpha = 0.2;
            const point1 = mappingToGlobal({x: 0.5, y: 0});
            const point2 = mappingToGlobal({x: 0.5, y: 1});
            const point3 = mappingToGlobal({x: 0.4, y: 0.8});
            const point4 = mappingToGlobal({x: 0.6, y: 0.8});
            this.ctx!.beginPath();
            this.ctx!.moveTo(point1.x, point1.y);
            this.ctx!.lineTo(point2.x, point2.y);
            this.ctx!.lineTo(point3.x, point3.y);
            this.ctx!.lineTo(point4.x, point4.y);
            this.ctx!.lineTo(point2.x, point2.y);
            this.ctx!.stroke();
            this.ctx!.restore();
        }
    }
    protected redraw() {
        this.ctx!.clearRect(0, 0, this.retinaSize!.width, this.retinaSize!.height);
        if (this.chartDatum) {
            this.ctx!.save();
            //this.drawBoundingBox(this.remap.chartToGlobal);
            //this.drawBoundingBox(this.remap.xRullerToGlobal);
            //this.drawBoundingBox(this.remap.yRullerToGlobal);
            this.ctx!.restore();
            const entries:[providerKeyT, ChartPointData[]][] = Object.entries(this.chartDatum.byProvider) as [providerKeyT, ChartPointData[]][];
            entries.forEach(([providerKey, chartPoints])=> {
                const baseColor = providerColors[providerKey];
                this.drawProviderMean(providerKey, chartPoints, this.chartDatum!.firstHourstep, baseColor, 2, [5, 5]);
                this.drawProviderMinMax(providerKey, chartPoints, this.chartDatum!.firstHourstep, baseColor);
            });

            { // reference
                const baseColor = {r: 0, g: 0, b: 0, a: 1};
                this.drawProviderMean('reference', this.chartDatum.reference, this.chartDatum!.firstHourstep, baseColor, 8);
                this.drawProviderMinMax('reference', this.chartDatum.reference, this.chartDatum!.firstHourstep, baseColor);
            }

            this.drawXRuller();
            this.drawYRuller();
            this.drawHotPoint();
        } else {
            this.ctx!.save();
            const virtualSize = 24;
            const retinaSize = virtualSize * window.devicePixelRatio;
            this.ctx!.font = `${retinaSize}px Roboto, sans-serif`;
            this.ctx!.textAlign = 'center';
            this.ctx!.fillText('no datum', this.retinaSize!.width / 2, this.retinaSize!.height / 2);
            this.ctx!.restore();
        }
    }
    protected drawProviderMean(providerKey: string, chartPoints: ChartPointData[], firstHourstep: number, color: rgbaT, lineWidth: number = 4, lineDash: [number, number] | undefined = undefined) {
        const firstChartPoint = chartPoints[0];
        if (firstChartPoint) {
            const htmlColor = rgbaToHtmlColor(dimColor(color));
            this.ctx!.save();
            this.ctx!.strokeStyle = htmlColor;
            this.ctx!.lineWidth = lineWidth;
            this.ctx!.beginPath();
            if (lineDash) {
                this.ctx!.setLineDash(lineDash);
            }
            const firstGlobalPosition = this.remap.chartToGlobal((this.remap.datumToLocal({x: firstHourstep, y: firstChartPoint.value.meanValue!})));
            this.ctx!.moveTo(firstGlobalPosition.x, firstGlobalPosition.y);
            chartPoints.forEach((chartPoint, chartPointIdx) => {
                const globalPosition = this.remap.chartToGlobal((this.remap.datumToLocal({x: firstHourstep + chartPointIdx, y: chartPoint.value.meanValue!})));
                this.ctx!.lineTo(globalPosition.x, globalPosition.y);
            });
            this.ctx!.stroke();
            this.ctx!.restore();

        }
    }
    protected drawProviderMinMax(providerKey: string, chartPoints: ChartPointData[], firstHourstep: number, color: rgbaT) {
        const firstChartPoint = chartPoints[0];
        if (firstChartPoint) {
            const htmlColor = rgbaToHtmlColor(color);
            this.ctx!.save();
            this.ctx!.fillStyle = htmlColor;
            this.ctx!.globalAlpha = 0.2;
            this.ctx!.beginPath();
            { // min slope
                const firstGlobalPosition = this.remap.chartToGlobal((this.remap.datumToLocal({x: firstHourstep, y: firstChartPoint.value.minValue!})));
                this.ctx!.moveTo(firstGlobalPosition.x, firstGlobalPosition.y);
                chartPoints.forEach((chartPoint, chartPointIdx) => {
                    const globalPosition = this.remap.chartToGlobal((this.remap.datumToLocal({x: firstHourstep + chartPointIdx, y: chartPoint.value.minValue!})));
                    this.ctx!.lineTo(globalPosition.x, globalPosition.y);
                });
            }
            { // max slope
                chartPoints.slice().reverse().forEach((chartPoint, chartPointIdx) => {
                    const globalPosition = this.remap.chartToGlobal((this.remap.datumToLocal({x: firstHourstep + chartPoints.length - 1 - chartPointIdx, y: chartPoint.value.maxValue!})));
                    this.ctx!.lineTo(globalPosition.x, globalPosition.y);
                });
            }
            this.ctx!.closePath();
            this.ctx!.fill();
            this.ctx!.restore();

        }
    }
    protected drawXRuller() {
        const stepMinGlobalWidth = 160 * window.devicePixelRatio;
        const stepGlobalWidth = Math.max(stepMinGlobalWidth, this.globalCoords.xRullerGlobalSize.width / this.datumBounds.x.width);
        const stepDatumWidth = stepGlobalWidth / this.globalCoords.xRullerGlobalSize.width * this.datumBounds.x.width;
        const stepsCount = Math.floor(this.globalCoords.xRullerGlobalSize.width / stepGlobalWidth);
        this.ctx!.save();

        {
            const quaterdaysCount = Math.ceil(this.datumBounds.x.width / 6) + 1;
            const firstHourstep = this.datumBounds.x.min;
            const firstDate = hourstepToDate(firstHourstep);
            const firstQuaterdaystep = dateToQuaterdaystep(firstDate);
            const firstQuaterdayDate = quaterdaystepToDate(firstQuaterdaystep);
            const firstQuaterdayHourstep = dateToHourstep(firstQuaterdayDate);
            const quaterdayHourstepDiff = firstQuaterdayHourstep - firstHourstep;
            console.log('AAAA, firstDate', firstDate);
            for (let quaterdayIdx = 0; quaterdayIdx < quaterdaysCount; quaterdayIdx++) {
                const dataX = firstHourstep + quaterdayHourstepDiff + quaterdayIdx * 6;
                const localX1 = this.remap.datumToLocal({x: dataX, y: 0}).x;
                const localX2 = this.remap.datumToLocal({x: dataX + 6, y: 0}).x;
                {
                    const globalPoint1 = this.remap.xRullerToGlobal({x: localX1, y: 0.8});
                    const globalPoint2 = this.remap.xRullerToGlobal({x: localX2, y: 1});
                    const htmlColor = rgbaToHtmlColor(quaterdayColors[(firstQuaterdaystep + quaterdayIdx) % 4]);
                    this.ctx!.fillStyle = htmlColor;
                    this.ctx!.globalAlpha = 1;
                    this.ctx!.fillRect(globalPoint1.x, globalPoint1.y, globalPoint2.x - globalPoint1.x, globalPoint2.y - globalPoint1.y);
                }
                {
                    const globalPoint1 = this.remap.chartToGlobal({x: localX1, y: 0});
                    const globalPoint2 = this.remap.chartToGlobal({x: localX2, y: 1});
                    const htmlColor = rgbaToHtmlColor(quaterdayColors[(firstQuaterdaystep + quaterdayIdx) % 4]);
                    this.ctx!.fillStyle = htmlColor;
                    this.ctx!.globalAlpha = 0.1;
                    this.ctx!.fillRect(globalPoint1.x, globalPoint1.y, globalPoint2.x - globalPoint1.x, globalPoint2.y - globalPoint1.y);
                }
            }
        }

        {
            const virtualSize = 14;
            const retinaSize = virtualSize * window.devicePixelRatio;
            this.ctx!.font = `${retinaSize}px Roboto, sans-serif`;
            this.ctx!.strokeStyle = '#000';
            this.ctx!.fillStyle = '#000';
            this.ctx!.textBaseline = 'alphabetic';
            this.ctx!.textAlign = 'center';
            this.ctx!.globalAlpha = 1;
            const firstHotStepIdx = Math.floor(this.hotPointChartPosition.x * (stepsCount - 1));
            for (let stepIdx = 0; stepIdx < stepsCount; stepIdx++) {
                if (stepIdx !== firstHotStepIdx && stepIdx !== firstHotStepIdx + 1) {
                    const localX = stepIdx / (stepsCount - 1);
                    const datumX = localX * this.datumBounds.x.width + this.datumBounds.x.min;
                    const globalPoint1 = this.remap.xRullerToGlobal({x: localX, y: 0});
                    const globalPoint2 = this.remap.xRullerToGlobal({x: localX, y: 0.5});
                    const globalPoint3 = this.remap.xRullerToGlobal({x: localX, y: 1});
                    this.ctx!.beginPath();
                    this.ctx!.moveTo(globalPoint2.x, globalPoint2.y);
                    this.ctx!.lineTo(globalPoint3.x, globalPoint3.y);
                    this.ctx!.stroke();
                    const date = hourstepToDate(datumX);
                    const prettyDatetime = Pretty.date(date) + ' ' + Pretty.time(date);
                    this.ctx!.fillText(prettyDatetime, globalPoint1.x, globalPoint1.y);
                }
            }
        }
        {
            const hotLocalX = this.hotPointChartPosition.x;
            const hotDatumX = hotLocalX * this.datumBounds.x.width + this.datumBounds.x.min;
            const hotGlobalPoint1 = this.remap.xRullerToGlobal({x: hotLocalX, y: 0});
            const hotGlobalPoint2 = this.remap.xRullerToGlobal({x: hotLocalX, y: 0.5});
            const hotGlobalPoint3 = this.remap.xRullerToGlobal({x: hotLocalX, y: 1});
            this.ctx!.beginPath();
            this.ctx!.moveTo(hotGlobalPoint2.x, hotGlobalPoint2.y);
            this.ctx!.lineTo(hotGlobalPoint3.x, hotGlobalPoint3.y);
            this.ctx!.stroke();
            const virtualSize = 14;
            const retinaSize = virtualSize * window.devicePixelRatio;
            this.ctx!.font = `900 ${retinaSize}px Roboto, sans-serif`;
            const date = hourstepToDate(hotDatumX);
            const prettyDatetime = Pretty.date(date) + ' ' + Pretty.time(date) + ' ' + Pretty.quaterday(date);
            const prettyDatetimeShift = Pretty.relativeDay(date);
            this.ctx!.fillText(prettyDatetime, hotGlobalPoint1.x, hotGlobalPoint1.y);
            this.ctx!.fillText(prettyDatetimeShift, hotGlobalPoint1.x, hotGlobalPoint1.y + 12);
        }
        {
            const globalPoint1 = this.remap.xRullerToGlobal({x: 1, y: 1});
            const globalPoint2 = this.remap.xRullerToGlobal({x: 0, y: 1});
            this.ctx!.beginPath();
            this.ctx!.moveTo(globalPoint1.x, globalPoint1.y);
            this.ctx!.lineTo(globalPoint2.x, globalPoint2.y);
            this.ctx!.stroke();
        }
        this.ctx!.restore();
    }

    protected drawYRuller() {
        const stepMinGlobalHeight = 16 * window.devicePixelRatio;
        const stepGlobalHeight = Math.max(stepMinGlobalHeight, this.globalCoords.yRullerGlobalSize.height / this.datumBounds.y.height);
        //const stepDatumHeight = stepGlobalHeight / this.globalCoords.yRullerGlobalSize.height * this.datumBounds.y.height;
        const stepsCount = Math.floor(this.globalCoords.yRullerGlobalSize.height / stepGlobalHeight);
        this.ctx!.save();
        const virtualSize = 14;
        const retinaSize = virtualSize * window.devicePixelRatio;
        this.ctx!.font = `${retinaSize}px Roboto, sans-serif`;
        this.ctx!.strokeStyle = '#000';
        this.ctx!.fillStyle = '#000';
        this.ctx!.textBaseline = 'middle';
        this.ctx!.textAlign = 'right';
        const firstHotStepIdx = Math.floor(this.hotPointChartPosition.y * (stepsCount - 1));
        for (let stepIdx = 0; stepIdx < stepsCount; stepIdx++) {
            if (stepIdx !== firstHotStepIdx && stepIdx !== firstHotStepIdx + 1) {
                const localY = stepIdx / (stepsCount - 1);
                const datumY = localY * this.datumBounds.y.height + this.datumBounds.y.min;
                const globalPoint1 = this.remap.yRullerToGlobal({x: 1, y: localY});
                const globalPoint2 = this.remap.yRullerToGlobal({x: 0.25, y: localY});
                const globalPoint3 = this.remap.yRullerToGlobal({x: 0, y: localY});
                this.ctx!.beginPath();
                this.ctx!.moveTo(globalPoint2.x, globalPoint2.y);
                this.ctx!.lineTo(globalPoint3.x, globalPoint3.y);
                this.ctx!.stroke();
                this.ctx!.fillText(Pretty.number(datumY) + ' ' + this.chartDatum!.unit, globalPoint1.x, globalPoint1.y);
            }
        }
        {
            const hotLocalY = this.hotPointChartPosition.y;
            const hotDatumY = hotLocalY * this.datumBounds.y.height + this.datumBounds.y.min;
            const hotGlobalPoint1 = this.remap.yRullerToGlobal({x: 1, y: hotLocalY});
            const hotGlobalPoint2 = this.remap.yRullerToGlobal({x: 0.25, y: hotLocalY});
            const hotGlobalPoint3 = this.remap.yRullerToGlobal({x: 0, y: hotLocalY});
            this.ctx!.beginPath();
            this.ctx!.moveTo(hotGlobalPoint2.x, hotGlobalPoint2.y);
            this.ctx!.lineTo(hotGlobalPoint3.x, hotGlobalPoint3.y);
            this.ctx!.stroke();
            const virtualSize = 14;
            const retinaSize = virtualSize * window.devicePixelRatio;
            this.ctx!.font = `900 ${retinaSize}px Roboto, sans-serif`;
            this.ctx!.fillText(Pretty.number(hotDatumY, 1, true) + ' ' + this.chartDatum!.unit, hotGlobalPoint1.x, hotGlobalPoint1.y);
        }
        {
            const globalPoint1 = this.remap.yRullerToGlobal({x: 0, y: 0});
            const globalPoint2 = this.remap.yRullerToGlobal({x: 0, y: 1});
            this.ctx!.beginPath();
            this.ctx!.moveTo(globalPoint1.x, globalPoint1.y);
            this.ctx!.lineTo(globalPoint2.x, globalPoint2.y);
            this.ctx!.stroke();
        }
        this.ctx!.restore();
    }

    protected drawHotPoint() {
        const chartHotPointGlobalPositionX1 = this.remap.chartToGlobal({x: this.hotPointChartPosition.x, y: 0});
        const chartHotPointGlobalPositionX2 = this.remap.chartToGlobal({x: this.hotPointChartPosition.x, y: 1});
        const chartHotPointGlobalPositionY1 = this.remap.chartToGlobal({x: 0, y: this.hotPointChartPosition.y});
        const chartHotPointGlobalPositionY2 = this.remap.chartToGlobal({x: 1, y: this.hotPointChartPosition.y});
        this.ctx!.save();
        this.ctx!.strokeStyle = '#000';
        this.ctx!.lineWidth = 0.5;
        this.ctx!.beginPath();
        this.ctx!.moveTo(chartHotPointGlobalPositionX1.x, chartHotPointGlobalPositionX1.y);
        this.ctx!.lineTo(chartHotPointGlobalPositionX2.x, chartHotPointGlobalPositionX2.y);
        this.ctx!.stroke();
        this.ctx!.beginPath();
        this.ctx!.moveTo(chartHotPointGlobalPositionY1.x, chartHotPointGlobalPositionY1.y);
        this.ctx!.lineTo(chartHotPointGlobalPositionY2.x, chartHotPointGlobalPositionY2.y);
        this.ctx!.stroke();
        this.ctx!.restore();
    }
}

