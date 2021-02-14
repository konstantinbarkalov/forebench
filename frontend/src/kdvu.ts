import { Pretty } from './shared/frontend/pretty.js';

export class Kdvu {
    constructor(
        public key: string,
        public minValue?: number,
        public meanValue?: number,
        public maxValue?: number,
        public unit?: string,
    ) {

    }
}
export class KdvuWidget {
    constructor(private $container: HTMLElement) {
        this.buildDom();
    }
    private $root?: HTMLElement;
    private $key?: HTMLElement;
    private $value?: HTMLElement;
    private $valueMin?: HTMLElement;
    private $valueMean?: HTMLElement;
    private $valueMax?: HTMLElement;
    private $unit?: HTMLElement;
    private $keyValueDelimiter?: HTMLElement;
    private $minMeanDelimiter?: HTMLElement;
    private $meanMaxDelimiter?: HTMLElement;
    private $minMaxDelimiter?: HTMLElement;
    private $valueUnitDelimiter?: HTMLElement;
    private kdvu?: Kdvu;
    public setKdvu(kdvu: Kdvu) {
        this.kdvu = kdvu;
        this.updateDom_kdvu();
    }
    private buildDom() {
        this.$root = document.createElement('div');
        this.$root.classList.add('kdvu');
        this.$key = document.createElement('div');
        this.$key.classList.add('kdvu__key');
        this.$value = document.createElement('div');
        this.$value.classList.add('kdvu__value');
        this.$valueMin = document.createElement('div');
        this.$valueMin.classList.add('kdvu__value-min');
        this.$valueMean = document.createElement('div');
        this.$valueMean.classList.add('kdvu__value-mean');
        this.$valueMax = document.createElement('div');
        this.$valueMax.classList.add('kdvu__value-max');
        this.$unit = document.createElement('div');
        this.$unit.classList.add('kdvu__unit');
        this.$keyValueDelimiter = document.createElement('div');
        this.$keyValueDelimiter.classList.add('kdvu__key-value-delimiter');
        this.$minMeanDelimiter = document.createElement('div');
        this.$minMeanDelimiter.classList.add('kdvu__min-mean-max-delimiter');
        this.$meanMaxDelimiter = document.createElement('div');
        this.$meanMaxDelimiter.classList.add('kdvu__min-mean-max-delimiter');
        this.$minMaxDelimiter = document.createElement('div');
        this.$minMaxDelimiter.classList.add('kdvu__min-mean-max-delimiter');
        this.$valueUnitDelimiter = document.createElement('div');
        this.$valueUnitDelimiter.classList.add('kdvu__min-mean-max-delimiter');

        this.$keyValueDelimiter!.innerText = ': ';
        this.$minMeanDelimiter!.innerText = ' .. ';
        this.$meanMaxDelimiter!.innerText = ' .. ';
        this.$minMaxDelimiter!.innerText = ' .. ';

        this.$valueUnitDelimiter!.innerText = ' ';
        this.$value.appendChild(this.$valueMin);
        this.$value.appendChild(this.$minMeanDelimiter);
        this.$value.appendChild(this.$minMaxDelimiter);
        this.$value.appendChild(this.$valueMean);
        this.$value.appendChild(this.$meanMaxDelimiter);
        this.$value.appendChild(this.$valueMax);

        this.$root.appendChild(this.$key);
        this.$root.appendChild(this.$keyValueDelimiter);
        this.$root.appendChild(this.$value);
        this.$root.appendChild(this.$valueUnitDelimiter);
        this.$root.appendChild(this.$unit);

        this.$container.appendChild(this.$root);
    }

    private updateDom_kdvu() {
        if (this.kdvu) {
            this.$key!.innerText = this.kdvu.key;
            this.$valueMin!.innerText = Pretty.number(this.kdvu.minValue);
            this.$valueMean!.innerText = Pretty.number(this.kdvu.meanValue);
            this.$valueMax!.innerText = Pretty.number(this.kdvu.maxValue);
            this.$unit!.innerText = this.kdvu.unit || '';
            const hasAnyValue = !!this.kdvu.minValue || !!this.kdvu.maxValue || !!this.kdvu.meanValue;
            const hasMinAndMeanValues = !!this.kdvu.minValue && !!this.kdvu.meanValue;
            const hasMeanAndMaxValues = !!this.kdvu.meanValue && !!this.kdvu.maxValue;
            const hasMinAndMaxNotMeanValues = !!this.kdvu.minValue && !!this.kdvu.maxValue && !this.kdvu.meanValue;
            const hasUnit = !!this.kdvu.unit;
            const hasAnyValueAndUnit = hasAnyValue && hasUnit;
            this.$minMeanDelimiter?.classList.toggle('kdvu__min-mean-max-delimiter--hidden', !hasMinAndMeanValues);
            this.$meanMaxDelimiter?.classList.toggle('kdvu__min-mean-max-delimiter--hidden', !hasMeanAndMaxValues);
            this.$minMaxDelimiter?.classList.toggle('kdvu__min-mean-max-delimiter--hidden', !hasMinAndMaxNotMeanValues);
            this.$minMeanDelimiter?.classList.toggle('kdvu__value-unit-delimiter--hidden', !hasAnyValueAndUnit);
        } else {
            this.$key!.innerText = '???';
            this.$valueMin!.innerText = '???';
            this.$valueMax!.innerText = '???';
            this.$unit!.innerText = '???';
            this.$minMeanDelimiter?.classList.remove('kdvu__min-mean-max-delimiter--hidden');
            this.$meanMaxDelimiter?.classList.remove('kdvu__min-mean-max-delimiter--hidden');
            this.$minMaxDelimiter?.classList.remove('kdvu__min-mean-max-delimiter--hidden');
        }
    }
}