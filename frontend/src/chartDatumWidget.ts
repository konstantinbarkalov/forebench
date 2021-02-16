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
export class ChartPointSerialDatum {
    constructor (
        public values: ChartPointData[],
        public shift: number,
    ) {
    }
}

export class ChartByProviderDatum implements ByProviderT<ChartPointSerialDatum> {
    constructor (
        public openWeather: ChartPointSerialDatum,
        public foreca: ChartPointSerialDatum,
        public yandex: ChartPointSerialDatum,
        public gidromet: ChartPointSerialDatum,
    ) {

    }

}

export class ChartDatum {
    constructor (
        public readingByProvider: ChartByProviderDatum,
        public forecastByProvider: ChartByProviderDatum,
        public reference: ChartPointSerialDatum,
        public hourstepDim: number,
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
    protected virtualSize: {width: number, height: number} = {width: 0, height: 0};
    protected xRullerVirualSize: number = 60;
    protected yRullerVirualSize: number = 80;
    protected outerVirualMargin: number = 32;
    protected innerVirualMargin: number = 8;
    protected chartDatum?: ChartDatum;
    protected hotPointChartPosition: positionT = {x: 1, y: 0.5};
    protected hotHourstep: number | undefined;
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
    protected retinaCoords: {
        retinaSize: sizeT,
        xRullerRetinaSize: sizeT,
        yRullerRetinaSize: sizeT,
        chartRetinaSize: sizeT,
        chartTopLeftRetinaPosition: positionT,
        xRullerTopLeftRetinaPosition: positionT,
        yRullerTopLeftRetinaPosition: positionT
    } = {
        retinaSize: {width: 0, height: 0},
        xRullerRetinaSize: {width: 0, height: 0},
        yRullerRetinaSize: {width: 0, height: 0},
        chartRetinaSize: {width: 0, height: 0},
        chartTopLeftRetinaPosition: {x: 0, y: 0},
        xRullerTopLeftRetinaPosition: {x: 0, y: 0},
        yRullerTopLeftRetinaPosition: {x: 0, y: 0}
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
            const byProviders: ByProviderT<ChartPointSerialDatum>[] = [this.chartDatum.forecastByProvider, this.chartDatum.readingByProvider];
            type keyT = 'minValue' | 'meanValue' | 'maxValue';
            const keys: keyT[] = ['minValue','meanValue', 'maxValue']

            byProviders.forEach(byProvider => {
                Object.values(byProvider).forEach(datum => {
                    datum.values.forEach(chartPoint => {
                        keys.forEach(key => {
                            const value = chartPoint.value[key];
                            if (value !== undefined) {
                                this.datumBounds.y.min = Math.min(this.datumBounds.y.min, value);
                                this.datumBounds.y.max = Math.max(this.datumBounds.y.max, value);
                            }
                        })
                    })
                })
            })




            this.chartDatum!.reference.values.forEach(chartPoint => {
                keys.forEach(key => {
                    const value = chartPoint.value[key];
                    if (value !== undefined) {
                        this.datumBounds.y.min = Math.min(this.datumBounds.y.min, value);
                        this.datumBounds.y.max = Math.max(this.datumBounds.y.max, value);
                    }
                });
            });
            this.datumBounds.x.min = this.chartDatum.firstHourstep;
            this.datumBounds.x.max = this.chartDatum.firstHourstep + this.chartDatum.hourstepDim - 1;
            this.datumBounds.x.width = this.datumBounds.x.max - this.datumBounds.x.min;
            this.datumBounds.y.height = this.datumBounds.y.max - this.datumBounds.y.min;

        }

    }
    protected recalcRetinaCoords() {
        const retinaSize = {
            width: this.virtualSize.width * window.devicePixelRatio,
            height: this.virtualSize.height * window.devicePixelRatio,
        }
        const xRullerRetina1DSize = this.xRullerVirualSize * window.devicePixelRatio;
        const yRullerRetina1DSize = this.yRullerVirualSize * window.devicePixelRatio;
        const outerRetinaMargin = this.outerVirualMargin * window.devicePixelRatio;
        const innerRetinaMargin = this.innerVirualMargin * window.devicePixelRatio;
        const xRullerRetinaSize = {
            width: retinaSize.width - outerRetinaMargin * 2 - innerRetinaMargin * 1 - yRullerRetina1DSize,
            height: xRullerRetina1DSize,
        }
        const yRullerRetinaSize = {
            width: yRullerRetina1DSize,
            height: retinaSize.height - outerRetinaMargin * 2 - innerRetinaMargin * 1 - xRullerRetina1DSize,
        }
        const chartRetinaSize = {
            width: retinaSize.width - outerRetinaMargin * 2 - innerRetinaMargin * 1 - yRullerRetinaSize.width,
            height: retinaSize.height - outerRetinaMargin * 2 - innerRetinaMargin * 1 - xRullerRetinaSize.height,
        }
        const chartTopLeftRetinaPosition = {
            x: outerRetinaMargin * 1,
            y: outerRetinaMargin * 1,
        }
        const xRullerTopLeftRetinaPosition = {
            x: outerRetinaMargin * 1,
            y: outerRetinaMargin * 1 + innerRetinaMargin * 1 + chartRetinaSize.height,
        }
        const yRullerTopLeftRetinaPosition = {
            x: outerRetinaMargin * 1 + innerRetinaMargin * 1 + chartRetinaSize.width,
            y: outerRetinaMargin * 1,
        }
        this.retinaCoords = {
            retinaSize,
            xRullerRetinaSize,
            yRullerRetinaSize,
            chartRetinaSize,
            chartTopLeftRetinaPosition,
            xRullerTopLeftRetinaPosition,
            yRullerTopLeftRetinaPosition
        }
    }
    protected remap = {
        chartToRetina: (chartPosition: positionT) => {
            const retinaPosition = {
                x: this.retinaCoords.chartTopLeftRetinaPosition.x + chartPosition.x * this.retinaCoords.chartRetinaSize.width,
                y: this.retinaCoords.chartTopLeftRetinaPosition.y + (1 - chartPosition.y) * this.retinaCoords.chartRetinaSize.height,
            }
            return retinaPosition;
        },
        xRullerToRetina: (xRullerPosition: positionT) => {
            const retinaPosition = {
                x: this.retinaCoords.xRullerTopLeftRetinaPosition.x + xRullerPosition.x * this.retinaCoords.xRullerRetinaSize.width,
                y: this.retinaCoords.xRullerTopLeftRetinaPosition.y + (1 - xRullerPosition.y) * this.retinaCoords.xRullerRetinaSize.height,
            }
            return retinaPosition;
        },
        yRullerToRetina: (yRullerPosition: positionT) => {
            const retinaPosition = {
                x: this.retinaCoords.yRullerTopLeftRetinaPosition.x + yRullerPosition.x * this.retinaCoords.yRullerRetinaSize.width,
                y: this.retinaCoords.yRullerTopLeftRetinaPosition.y + (1 - yRullerPosition.y) * this.retinaCoords.yRullerRetinaSize.height,
            }
            return retinaPosition;
        },
        retinaToChart: (retinaPosition: positionT) => {
            const chartPosition = {
                x: (retinaPosition.x - this.retinaCoords.chartTopLeftRetinaPosition.x) / this.retinaCoords.chartRetinaSize.width,
                y: 1 - (retinaPosition.y - this.retinaCoords.chartTopLeftRetinaPosition.y) / this.retinaCoords.chartRetinaSize.height,
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
            const retinaPosition = {
                x: e.offsetX * window.devicePixelRatio,
                y: e.offsetY * window.devicePixelRatio
            }
            this.setHotpoint(retinaPosition);
        });
        setTimeout(()=>{
            this.onDomResize(); // this.redraw(); inside
        }, 0);

    }
    protected onDomResize() {
        this.virtualSize = {
            width: this.$root!.clientWidth,
            height: this.$root!.clientHeight,
        }
        this.recalcRetinaCoords();
        const intRetinaSize = {
            width: Math.floor(this.retinaCoords.retinaSize.width),
            height: Math.floor(this.retinaCoords.retinaSize.height),
        }
        const intishVirtualSize = {
            width: (intRetinaSize.width / window.devicePixelRatio),
            height: (intRetinaSize.height / window.devicePixelRatio),
        }
        this.$canvas!.width = intRetinaSize.width;
        this.$canvas!.height = intRetinaSize.height;
        this.$canvas!.style.width = intishVirtualSize.width + 'px';
        this.$canvas!.style.height = intishVirtualSize.height + 'px';
        this.redraw();
    }
    protected setHotpoint(retinaPosition: positionT) {
        this.hotPointChartPosition = clampLocalPosition(this.remap.retinaToChart(retinaPosition));
        this.redraw();
    }
    public setHothourstep(hotHourstep: number | undefined) {
        this.hotHourstep = hotHourstep;
        this.redraw();
    }
    protected drawBoundingBox(mappingToRetina: remapFnT): void {
        { // box
            this.ctx!.save();
            this.ctx!.strokeStyle = '#000';
            this.ctx!.globalAlpha = 1;
            const point1 = mappingToRetina({x: 0, y: 0});
            const point2 = mappingToRetina({x: 0, y: 1});
            const point3 = mappingToRetina({x: 1, y: 1});
            const point4 = mappingToRetina({x: 1, y: 0});
            this.ctx!.beginPath();
            this.ctx!.moveTo(point1.x, point1.y);
            this.ctx!.lineTo(point2.x, point2.y);
            this.ctx!.lineTo(point3.x, point3.y);
            this.ctx!.lineTo(point4.x, point4.y);
            this.ctx!.lineTo(point1.x, point1.y);
            this.ctx!.stroke();
            this.ctx!.restore();
        }
        // { // top arrow
        //     this.ctx!.save();
        //     this.ctx!.strokeStyle = '1px #000';
        //     this.ctx!.globalAlpha = 0.2;
        //     const point1 = mappingToRetina({x: 0.5, y: 0});
        //     const point2 = mappingToRetina({x: 0.5, y: 1});
        //     const point3 = mappingToRetina({x: 0.4, y: 0.8});
        //     const point4 = mappingToRetina({x: 0.6, y: 0.8});
        //     this.ctx!.beginPath();
        //     this.ctx!.moveTo(point1.x, point1.y);
        //     this.ctx!.lineTo(point2.x, point2.y);
        //     this.ctx!.lineTo(point3.x, point3.y);
        //     this.ctx!.lineTo(point4.x, point4.y);
        //     this.ctx!.lineTo(point2.x, point2.y);
        //     this.ctx!.stroke();
        //     this.ctx!.restore();
        // }
    }
    protected redraw() {
        this.ctx!.clearRect(0, 0, this.retinaCoords.retinaSize.width, this.retinaCoords.retinaSize.height);



        if (this.chartDatum) {
            this.ctx!.save();


            /////////
            const retinaPos1 = this.remap.chartToRetina({x: 0, y: 0});
            const retinaPos2 = this.remap.chartToRetina({x: 1, y: 1});
            this.ctx!.fillStyle = '#fff';
            this.ctx!.fillRect(retinaPos1.x, retinaPos1.y, retinaPos2.x - retinaPos1.x, retinaPos2.y - retinaPos1.y);
            /////////

            //this.drawBoundingBox(this.remap.chartToRetina);
            //this.drawBoundingBox(this.remap.xRullerToRetina);
            //this.drawBoundingBox(this.remap.yRullerToRetina);


            this.ctx!.restore();
            const forecastEntries:[providerKeyT, ChartPointSerialDatum][] = Object.entries(this.chartDatum.forecastByProvider) as [providerKeyT, ChartPointSerialDatum][];
            forecastEntries.forEach(([providerKey, chartPoints])=> {
                const baseColor = providerColors[providerKey];
                this.drawProviderMean(providerKey, chartPoints, this.chartDatum!.firstHourstep , baseColor, 2, [5, 5]);
                this.drawProviderMinMax(providerKey, chartPoints, this.chartDatum!.firstHourstep , baseColor);
            });

            const readingEntries:[providerKeyT, ChartPointSerialDatum][] = Object.entries(this.chartDatum.readingByProvider) as [providerKeyT, ChartPointSerialDatum][];
            readingEntries.forEach(([providerKey, chartPoints])=> {
                const baseColor = providerColors[providerKey];
                this.drawProviderMean(providerKey, chartPoints, this.chartDatum!.firstHourstep , baseColor, 2);
                this.drawProviderMinMax(providerKey, chartPoints, this.chartDatum!.firstHourstep , baseColor);
            });

            { // reference
                const baseColor = {r: 0, g: 0, b: 0, a: 0.67};
                this.drawProviderMean('reference', this.chartDatum.reference, this.chartDatum!.firstHourstep, baseColor, 16);
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
            this.ctx!.fillText('no datum', this.retinaCoords.retinaSize.width / 2, this.retinaCoords.retinaSize.height / 2);
            this.ctx!.restore();
        }
    }
    protected drawProviderMean(providerKey: string, serialDatum: ChartPointSerialDatum, firstHourstep: number, color: rgbaT, lineWidth: number = 4, lineDash: [number, number] | undefined = undefined) {
        const chartPoints = serialDatum.values;
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
            const firstRetinaPosition = this.remap.chartToRetina((this.remap.datumToLocal({x: firstHourstep + serialDatum.shift, y: firstChartPoint.value.meanValue!})));
            this.ctx!.moveTo(firstRetinaPosition.x, firstRetinaPosition.y);
            chartPoints.forEach((chartPoint, chartPointIdx) => {
                const retinaPosition = this.remap.chartToRetina((this.remap.datumToLocal({x: firstHourstep + serialDatum.shift + chartPointIdx, y: chartPoint.value.meanValue!})));
                this.ctx!.lineTo(retinaPosition.x, retinaPosition.y);
            });
            this.ctx!.stroke();
            this.ctx!.restore();

        }
    }
    protected drawProviderMinMax(providerKey: string, serialDatum: ChartPointSerialDatum, firstHourstep: number, color: rgbaT) {
        const chartPoints = serialDatum.values;
        const firstChartPoint = chartPoints[0];
        if (firstChartPoint) {
            const htmlColor = rgbaToHtmlColor(color);
            this.ctx!.save();
            this.ctx!.fillStyle = htmlColor;
            this.ctx!.globalAlpha = 0.2;
            this.ctx!.beginPath();
            { // min slope
                const firstRetinaPosition = this.remap.chartToRetina((this.remap.datumToLocal({x: firstHourstep + serialDatum.shift, y: firstChartPoint.value.minValue!})));
                this.ctx!.moveTo(firstRetinaPosition.x, firstRetinaPosition.y);
                chartPoints.forEach((chartPoint, chartPointIdx) => {
                    const retinaPosition = this.remap.chartToRetina((this.remap.datumToLocal({x: firstHourstep + serialDatum.shift + chartPointIdx, y: chartPoint.value.minValue!})));
                    this.ctx!.lineTo(retinaPosition.x, retinaPosition.y);
                });
            }
            { // max slope
                chartPoints.slice().reverse().forEach((chartPoint, chartPointIdx) => {
                    const retinaPosition = this.remap.chartToRetina((this.remap.datumToLocal({x: firstHourstep + serialDatum.shift + chartPoints.length - 1 - chartPointIdx, y: chartPoint.value.maxValue!})));
                    this.ctx!.lineTo(retinaPosition.x, retinaPosition.y);
                });
            }
            this.ctx!.closePath();
            this.ctx!.fill();
            this.ctx!.restore();

        }
    }
    protected drawXRuller() {
        const stepMinRetinaWidth = 160 * window.devicePixelRatio;
        const stepRetinaWidth = Math.max(stepMinRetinaWidth, this.retinaCoords.xRullerRetinaSize.width / this.datumBounds.x.width);
        const stepDatumWidth = stepRetinaWidth / this.retinaCoords.xRullerRetinaSize.width * this.datumBounds.x.width;
        const stepsCount = Math.floor(this.retinaCoords.xRullerRetinaSize.width / stepRetinaWidth);
        this.ctx!.save();

        {
            const quaterdaysCount = Math.ceil(this.datumBounds.x.width / 6) + 1;
            const firstHourstep = this.datumBounds.x.min;
            const firstDate = hourstepToDate(firstHourstep);
            const firstQuaterdaystep = dateToQuaterdaystep(firstDate);
            const firstQuaterdayDate = quaterdaystepToDate(firstQuaterdaystep);
            const firstQuaterdayHourstep = dateToHourstep(firstQuaterdayDate);
            const quaterdayHourstepDiff = firstQuaterdayHourstep - firstHourstep;
            for (let quaterdayIdx = 0; quaterdayIdx < quaterdaysCount; quaterdayIdx++) {
                const dataX = firstHourstep + quaterdayHourstepDiff + quaterdayIdx * 6;
                const localX1 = this.remap.datumToLocal({x: dataX, y: 0}).x;
                const localX2 = this.remap.datumToLocal({x: dataX + 6, y: 0}).x;
                {
                    const retinaPoint1 = this.remap.xRullerToRetina({x: localX1, y: 0.8});
                    const retinaPoint2 = this.remap.xRullerToRetina({x: localX2, y: 1});
                    const htmlColor = rgbaToHtmlColor(quaterdayColors[(firstQuaterdaystep + quaterdayIdx) % 4]);
                    this.ctx!.fillStyle = htmlColor;
                    this.ctx!.globalAlpha = 1;
                    this.ctx!.fillRect(retinaPoint1.x, retinaPoint1.y, retinaPoint2.x - retinaPoint1.x, retinaPoint2.y - retinaPoint1.y);
                }
                {
                    const retinaPoint1 = this.remap.chartToRetina({x: localX1, y: 0});
                    const retinaPoint2 = this.remap.chartToRetina({x: localX2, y: 1});
                    const htmlColor = rgbaToHtmlColor(quaterdayColors[(firstQuaterdaystep + quaterdayIdx) % 4]);
                    this.ctx!.fillStyle = htmlColor;
                    this.ctx!.globalAlpha = 0.1;
                    this.ctx!.fillRect(retinaPoint1.x, retinaPoint1.y, retinaPoint2.x - retinaPoint1.x, retinaPoint2.y - retinaPoint1.y);
                }
            }
        }

        if (this.hotHourstep !== undefined) {
            const hotDatumX1 = this.hotHourstep;
            const hotDatumX2 = hotDatumX1 + 1;
            const hotDatumX3 = hotDatumX1 - 1;
            const hotLocalX1 = (hotDatumX1 - this.datumBounds.x.min) / this.datumBounds.x.width;
            const hotLocalX2 = (hotDatumX2 - this.datumBounds.x.min) / this.datumBounds.x.width;
            const hotLocalX3 = (hotDatumX3 - this.datumBounds.x.min) / this.datumBounds.x.width;
            const hotHourstepRetinaPoint1 = this.remap.chartToRetina({x: hotLocalX1, y: 0});
            const hotHourstepRetinaPoint2 = this.remap.chartToRetina({x: hotLocalX2, y: 1});
            const quaterdaystep = dateToQuaterdaystep(hourstepToDate(this.hotHourstep));
            const htmlColor = rgbaToHtmlColor(quaterdayColors[quaterdaystep % 4]);
            //this.ctx!.fillStyle = htmlColor;
            this.ctx!.fillStyle = '#fff';
            this.ctx!.globalAlpha = 0.75;
            //this.ctx!.fillRect(hotHourstepRetinaPoint1.x, hotHourstepRetinaPoint1.y, hotHourstepRetinaPoint2.x - hotHourstepRetinaPoint1.x, hotHourstepRetinaPoint2.y - hotHourstepRetinaPoint1.y);

            this.ctx!.lineWidth = 1;
            //this.ctx!.strokeStyle = htmlColor;
            this.ctx!.strokeStyle = '#000';
            this.ctx!.globalAlpha = 1;
            this.ctx!.beginPath();
            this.ctx!.moveTo(hotHourstepRetinaPoint1.x, hotHourstepRetinaPoint1.y);
            this.ctx!.lineTo(hotHourstepRetinaPoint1.x, hotHourstepRetinaPoint2.y);
            this.ctx!.stroke();
            this.ctx!.strokeStyle = '#000';
            this.ctx!.globalAlpha = 1;
            this.ctx!.beginPath();
            this.ctx!.moveTo(hotHourstepRetinaPoint2.x, hotHourstepRetinaPoint1.y);
            this.ctx!.lineTo(hotHourstepRetinaPoint2.x, hotHourstepRetinaPoint2.y);
            //this.ctx!.stroke();



            const hotHourstepChevronRetinaPoint1 = this.remap.xRullerToRetina({x: hotLocalX1, y: 1});
            const hotHourstepChevronRetinaPoint2 = this.remap.xRullerToRetina({x: hotLocalX2, y: 0.5});
            const hotHourstepChevronRetinaPoint3 = this.remap.xRullerToRetina({x: hotLocalX3, y: 0.5});
            this.ctx!.fillStyle = htmlColor;
            this.ctx!.strokeStyle = '#fff';
            this.ctx!.lineWidth = 4;
            this.ctx!.globalAlpha = 1;
            this.ctx!.beginPath();
            this.ctx!.moveTo(hotHourstepChevronRetinaPoint3.x, hotHourstepChevronRetinaPoint3.y);
            this.ctx!.lineTo(hotHourstepChevronRetinaPoint1.x, hotHourstepChevronRetinaPoint1.y);
            this.ctx!.lineTo(hotHourstepChevronRetinaPoint2.x, hotHourstepChevronRetinaPoint2.y);
            this.ctx!.closePath();
            this.ctx!.fill();
            this.ctx!.stroke();
        }

        {
            this.ctx!.lineWidth = 0.5;
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
                    const retinaPoint1 = this.remap.xRullerToRetina({x: localX, y: 0});
                    const retinaPoint2 = this.remap.xRullerToRetina({x: localX, y: 0.5});
                    const retinaPoint3 = this.remap.xRullerToRetina({x: localX, y: 1});
                    this.ctx!.beginPath();
                    this.ctx!.moveTo(retinaPoint2.x, retinaPoint2.y);
                    this.ctx!.lineTo(retinaPoint3.x, retinaPoint3.y);
                    this.ctx!.stroke();
                    const date = hourstepToDate(datumX);
                    const prettyDatetime = Pretty.date(date) + ' ' + Pretty.time(date);
                    this.ctx!.fillText(prettyDatetime, retinaPoint1.x, retinaPoint1.y);
                }
            }
        }
        {
            const hotLocalX = this.hotPointChartPosition.x;
            const hotDatumX = hotLocalX * this.datumBounds.x.width + this.datumBounds.x.min;
            const hotRetinaPoint1 = this.remap.xRullerToRetina({x: hotLocalX, y: 0});
            const hotRetinaPoint2 = this.remap.xRullerToRetina({x: hotLocalX, y: 0.5});
            const hotRetinaPoint3 = this.remap.xRullerToRetina({x: hotLocalX, y: 1});
            this.ctx!.beginPath();
            this.ctx!.moveTo(hotRetinaPoint2.x, hotRetinaPoint2.y);
            this.ctx!.lineTo(hotRetinaPoint3.x, hotRetinaPoint3.y);
            this.ctx!.stroke();
            const virtualSize = 14;
            const retinaSize = virtualSize * window.devicePixelRatio;
            this.ctx!.font = `900 ${retinaSize}px Roboto, sans-serif`;
            const date = hourstepToDate(hotDatumX);
            const prettyDatetime = Pretty.date(date) + ' ' + Pretty.time(date) + ' ' + Pretty.quaterday(date);
            const prettyDatetimeShift = Pretty.relativeDay(date);
            this.ctx!.fillText(prettyDatetime, hotRetinaPoint1.x, hotRetinaPoint1.y);
            this.ctx!.fillText(prettyDatetimeShift, hotRetinaPoint1.x, hotRetinaPoint1.y + retinaSize);
        }
        {
            const retinaPoint1 = this.remap.xRullerToRetina({x: 1, y: 1});
            const retinaPoint2 = this.remap.xRullerToRetina({x: 0, y: 1});
            this.ctx!.beginPath();
            this.ctx!.moveTo(retinaPoint1.x, retinaPoint1.y);
            this.ctx!.lineTo(retinaPoint2.x, retinaPoint2.y);
            this.ctx!.stroke();
        }

        this.ctx!.restore();
    }

    protected drawYRuller() {
        const stepMinRetinaHeight = 16 * window.devicePixelRatio;
        const stepRetinaHeight = Math.max(stepMinRetinaHeight, this.retinaCoords.yRullerRetinaSize.height / this.datumBounds.y.height);
        //const stepDatumHeight = stepRetinaHeight / this.retinaCoords.yRullerRetinaSize.height * this.datumBounds.y.height;
        const stepsCount = Math.floor(this.retinaCoords.yRullerRetinaSize.height / stepRetinaHeight);
        this.ctx!.save();
        const virtualSize = 14;
        const retinaSize = virtualSize * window.devicePixelRatio;
        this.ctx!.font = `${retinaSize}px Roboto, sans-serif`;
        this.ctx!.strokeStyle = '#000';
        this.ctx!.fillStyle = '#000';
        this.ctx!.textBaseline = 'middle';
        this.ctx!.textAlign = 'right';
        this.ctx!.lineWidth = 0.5;
        const firstHotStepIdx = Math.floor(this.hotPointChartPosition.y * (stepsCount - 1));
        for (let stepIdx = 0; stepIdx < stepsCount; stepIdx++) {
            if (stepIdx !== firstHotStepIdx && stepIdx !== firstHotStepIdx + 1) {
                const localY = stepIdx / (stepsCount - 1);
                const datumY = localY * this.datumBounds.y.height + this.datumBounds.y.min;
                const retinaPoint1 = this.remap.yRullerToRetina({x: 1, y: localY});
                const retinaPoint2 = this.remap.yRullerToRetina({x: 0.25, y: localY});
                const retinaPoint3 = this.remap.yRullerToRetina({x: 0, y: localY});
                this.ctx!.beginPath();
                this.ctx!.moveTo(retinaPoint2.x, retinaPoint2.y);
                this.ctx!.lineTo(retinaPoint3.x, retinaPoint3.y);
                this.ctx!.stroke();
                this.ctx!.fillText(Pretty.number(datumY) + ' ' + this.chartDatum!.unit, retinaPoint1.x, retinaPoint1.y);
            }
        }
        {
            const hotLocalY = this.hotPointChartPosition.y;
            const hotDatumY = hotLocalY * this.datumBounds.y.height + this.datumBounds.y.min;
            const hotRetinaPoint1 = this.remap.yRullerToRetina({x: 1, y: hotLocalY});
            const hotRetinaPoint2 = this.remap.yRullerToRetina({x: 0.25, y: hotLocalY});
            const hotRetinaPoint3 = this.remap.yRullerToRetina({x: 0, y: hotLocalY});
            this.ctx!.beginPath();
            this.ctx!.moveTo(hotRetinaPoint2.x, hotRetinaPoint2.y);
            this.ctx!.lineTo(hotRetinaPoint3.x, hotRetinaPoint3.y);
            this.ctx!.stroke();
            const virtualSize = 14;
            const retinaSize = virtualSize * window.devicePixelRatio;
            this.ctx!.font = `900 ${retinaSize}px Roboto, sans-serif`;
            this.ctx!.fillText(Pretty.number(hotDatumY, 1, true) + ' ' + this.chartDatum!.unit, hotRetinaPoint1.x, hotRetinaPoint1.y);
        }
        {
            const retinaPoint1 = this.remap.yRullerToRetina({x: 0, y: 0});
            const retinaPoint2 = this.remap.yRullerToRetina({x: 0, y: 1});
            this.ctx!.beginPath();
            this.ctx!.moveTo(retinaPoint1.x, retinaPoint1.y);
            this.ctx!.lineTo(retinaPoint2.x, retinaPoint2.y);
            this.ctx!.stroke();
        }
        this.ctx!.restore();
    }

    protected drawHotPoint() {
        const chartHotPointRetinaPositionX1 = this.remap.chartToRetina({x: this.hotPointChartPosition.x, y: 0});
        const chartHotPointRetinaPositionX2 = this.remap.chartToRetina({x: this.hotPointChartPosition.x, y: 1});
        const chartHotPointRetinaPositionY1 = this.remap.chartToRetina({x: 0, y: this.hotPointChartPosition.y});
        const chartHotPointRetinaPositionY2 = this.remap.chartToRetina({x: 1, y: this.hotPointChartPosition.y});
        this.ctx!.save();
        this.ctx!.strokeStyle = '#000';
        this.ctx!.lineWidth = 0.5;
        this.ctx!.beginPath();
        this.ctx!.moveTo(chartHotPointRetinaPositionX1.x, chartHotPointRetinaPositionX1.y);
        this.ctx!.lineTo(chartHotPointRetinaPositionX2.x, chartHotPointRetinaPositionX2.y);
        this.ctx!.stroke();
        this.ctx!.beginPath();
        this.ctx!.moveTo(chartHotPointRetinaPositionY1.x, chartHotPointRetinaPositionY1.y);
        this.ctx!.lineTo(chartHotPointRetinaPositionY2.x, chartHotPointRetinaPositionY2.y);
        this.ctx!.stroke();
        this.ctx!.restore();
    }
}

