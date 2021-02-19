import { dateToHourstep, hourstepToDate } from './shared/frontend/chrono.js';
import { Pretty } from './shared/frontend/pretty.js';

export type timemachineBoundsT = {from: number, to: number};
export type timemachineSpeedT = 1 | 2;
export class TimemachineWidget {
    constructor(private $container: HTMLElement, private cssPrefix:string = 'timemachine') {
        this.buildDom();
    }
    private $root?: HTMLElement;
    private $line1?: HTMLDivElement;
    private $line2?: HTMLDivElement;
    private $line3?: HTMLDivElement;
    private $block1?: HTMLDivElement;
    private $block2?: HTMLDivElement;
    private $block3?: HTMLDivElement;

    private $playForeward?: HTMLButtonElement;
    private $playBackward?: HTMLButtonElement;
    private $instantForeward?: HTMLButtonElement;
    private $instantBackward?: HTMLButtonElement;
    private $input?: HTMLInputElement;
    private $prettyBoundsFrom?: HTMLDivElement;
    private $prettyBoundsTo?: HTMLDivElement;
    private $prettyHourstep?: HTMLDivElement;
    private hourstep: number | undefined;
    private bounds: timemachineBoundsT | undefined;
    private isPlay: boolean = false;
    private isForeward: boolean = true;
    private speed: timemachineSpeedT = 1;
    private timeout: NodeJS.Timeout | undefined;
    public ee: EventTarget = new EventTarget();
    private undispatchIteration() {
      if (this.timeout) {
        clearTimeout(this.timeout);
        this.timeout = undefined;
      }
    }
    private dispatchIteration(dt: number = 0) {
      this.undispatchIteration();
      this.timeout = setTimeout(this.onTimeout, dt);
    }
    private onTimeout = () => {
      const dir = this.isForeward? 1 : -1
      const hourstep = this.hourstep! + dir;
      if (hourstep <= this.bounds!.to && hourstep >= this.bounds!.from) {
        const borderDist1 = Math.abs(hourstep - this.bounds!.from);
        const borderDist2 = Math.abs(this.bounds!.to - hourstep);
        const borderDist = Math.min(borderDist1, borderDist2);
        const capedBorderDist = Math.min(9, borderDist);
        const slowRatio = (9 - capedBorderDist) / 9;
        this.setHourstep(hourstep);
        const baseDuration = (this.speed === 1) ? 150 : 50;
        const slowExtraDuration = 50 * slowRatio**3;
        const duration = baseDuration + slowExtraDuration;
        this.dispatchIteration(duration);
      } else {
        this.stop();
      }
    };
    public play(isForeward: boolean = this.isForeward, speed:timemachineSpeedT = this.speed) {
      this.isForeward = isForeward;
      this.speed = speed;
      this.isPlay = true;
      this.updateDom_isPlay_isForeward_speed();
      this.dispatchIteration();
    }
    public stop() {
      this.isPlay = false;
      this.speed = 1;
      this.updateDom_isPlay_isForeward_speed();
      this.undispatchIteration();
    }
    private updateDom_isPlay_isForeward_speed() {
      this.$root!.classList.toggle('timemachine--play', this.isPlay);
      this.$root!.classList.toggle('timemachine--speed-1', this.speed === 1);
      this.$root!.classList.toggle('timemachine--speed-2', this.speed === 2);
      this.$input!.readOnly = this.isPlay;
      if (this.isPlay) {
        if (this.isForeward) {
          this.$playForeward!.innerText = (this.speed === 1) ? '⏩' : '▶️';
          this.$playBackward!.innerText = '◀️';
        } else {
          this.$playForeward!.innerText = '▶️';
          this.$playBackward!.innerText = (this.speed === 1) ? '⏪️' : '◀️';
        }
        this.$instantForeward!.innerText = '⏹️';
        this.$instantBackward!.innerText = '⏹️';
      } else {
        this.$playForeward!.innerText = '▶️';
        this.$playBackward!.innerText = '◀️';
        this.$instantForeward!.innerText = '⏭️';
        this.$instantBackward!.innerText = '⏮';

      }
    }

    public setBounds(bounds: timemachineBoundsT) {
        this.bounds = bounds;
        if (this.hourstep === undefined) {
          this.setHourstep(this.bounds.to);
        }
        this.updateDom_bounds();
    }
    private updateDom_bounds() {
      { // min
        const date = hourstepToDate(this.bounds!.from);
        const dateString = date.toISOString();
        const inputValue = dateString.slice(0, dateString.length - 1);
        this.$input!.min = inputValue;
      }
      { // max
        const date = hourstepToDate(this.bounds!.to);
        const dateString = date.toISOString();
        const inputValue = dateString.slice(0, dateString.length - 1);
        this.$input!.max = inputValue;
      }
    }
    public setHourstep(hourstep: number) {
      this.hourstep = hourstep;
      this.updateDom_hourstep();
      this.ee.dispatchEvent(new CustomEvent('hourstep', {detail: {hourstep: this.hourstep}}));
    }
    private updateDom_hourstep() {
      const date = hourstepToDate(this.hourstep!);
      const dateString = date.toISOString();
      const inputValue = dateString.slice(0, dateString.length - 1);
      this.$input!.value = inputValue;
      this.$prettyHourstep!.innerText = Pretty.relativeQuaterDay(date);
    }

    private buildDom() {
        this.$root = document.createElement('div');
        this.$root.classList.add(this.cssPrefix);

        this.$line1 = document.createElement('div');
        this.$line1.classList.add(this.cssPrefix + '-line');
        this.$line2 = document.createElement('div');
        this.$line2.classList.add(this.cssPrefix + '-line');
        this.$line3 = document.createElement('div');
        this.$line3.classList.add(this.cssPrefix + '-line');

        this.$block1 = document.createElement('div');
        this.$block1.classList.add(this.cssPrefix + '-block');
        this.$block2 = document.createElement('div');
        this.$block2.classList.add(this.cssPrefix + '-block');
        this.$block2.classList.add(this.cssPrefix + '-block--grow');
        this.$block3 = document.createElement('div');
        this.$block3.classList.add(this.cssPrefix + '-block');

        this.$instantBackward = document.createElement('button');
        this.$instantBackward.classList.add(this.cssPrefix + '-button');
        this.$instantBackward.classList.add(this.cssPrefix + '-instant-button');
        this.$instantForeward = document.createElement('button');
        this.$instantForeward.classList.add(this.cssPrefix + '-button');
        this.$instantForeward.classList.add(this.cssPrefix + '-instant-button');

        this.$input = document.createElement('input');
        this.$input.type = 'datetime-local';
        this.$input.step = '3600';
        this.$input.classList.add(this.cssPrefix + '-input');

        this.$playBackward = document.createElement('button');
        this.$playBackward.classList.add(this.cssPrefix + '-button');
        this.$playBackward.classList.add(this.cssPrefix + '-play-button');
        this.$playForeward = document.createElement('button');
        this.$playForeward.classList.add(this.cssPrefix + '-button');
        this.$playForeward.classList.add(this.cssPrefix + '-play-button');


        this.$prettyBoundsFrom = document.createElement('div');
        this.$prettyBoundsFrom.classList.add(this.cssPrefix + '-pretty-bounds-from');
        this.$prettyBoundsTo = document.createElement('div');
        this.$prettyBoundsTo.classList.add(this.cssPrefix + '-pretty-bounds-from');
        this.$prettyHourstep = document.createElement('div');
        this.$prettyHourstep.classList.add(this.cssPrefix + '-pretty-hourstep');

        this.$block1.appendChild(this.$instantBackward);
        this.$block1.appendChild(this.$playBackward);

        this.$block2.appendChild(this.$input);

        this.$block3.appendChild(this.$playForeward);
        this.$block3.appendChild(this.$instantForeward);

        this.$line2.appendChild(this.$block1);
        this.$line2.appendChild(this.$block2);
        this.$line2.appendChild(this.$block3);

        this.$line3.appendChild(this.$prettyBoundsFrom);
        this.$line3.appendChild(this.$prettyHourstep);
        this.$line3.appendChild(this.$prettyBoundsTo);

        this.$root.appendChild(this.$line1);
        this.$root.appendChild(this.$line2);
        this.$root.appendChild(this.$line3);

        this.$container.appendChild(this.$root);

        this.$instantBackward.addEventListener('click', this.onClick_instantBackward);
        this.$instantForeward.addEventListener('click', this.onClick_instantForeward);
        this.$playBackward.addEventListener('click', this.onClick_playBackward);
        this.$playForeward.addEventListener('click', this.onClick_playForeward);
        this.$input.addEventListener('click', this.onClick_input);
        this.$input.addEventListener('input', this.onInput_input);
        //this.updateDom_bounds();
        //this.updateDom_hourstep();
        this.updateDom_isPlay_isForeward_speed();
    }
    private onClick_instantBackward = () => {
      if (!this.isPlay) {
        this.setHourstep(this.bounds!.from);
      }
      this.stop();
    }
    private onClick_instantForeward = () => {
      if (!this.isPlay) {
        this.setHourstep(this.bounds!.to);
      }
      this.stop();
    }
    private onClick_playBackward = () => {
      if (!this.isForeward) {
        if (this.isPlay) {
          const newSpeed: timemachineSpeedT = (this.speed === 1) ? 2 : 1;
          this.play(false, newSpeed);
        } else {
          this.play(false, 1);
        }
      } else {
        this.play(false, 1);
      }
    }
    private onClick_playForeward = () => {
      if (this.isForeward) {
        if (this.isPlay) {
          const newSpeed: timemachineSpeedT = (this.speed === 1) ? 2 : 1;
          this.play(true, newSpeed);
        } else {
          this.play(true, 1);
        }
      } else {
        this.play(true, 1);
      }
    }
    private onClick_input = () => {
      this.stop();
    }
    private onInput_input = () => {
      const date = new Date(this.$input!.value);
      if (date) {
        let hourstep = dateToHourstep(date);
        if (this.bounds) {
          hourstep = Math.max(hourstep, this.bounds.from);
          hourstep = Math.min(hourstep, this.bounds.to);
        }
        this.setHourstep(hourstep);
      }

    }
}

