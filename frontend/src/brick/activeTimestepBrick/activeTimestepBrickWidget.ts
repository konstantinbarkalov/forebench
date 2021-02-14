import { AbstractBrickWidget } from '../abstractBrick/abstractBrickWidget.js';
import { ActiveTimestepBrick } from './activeTimestepBrick.js';
import { Pretty } from '../../shared/frontend/pretty.js';

export class ActiveTimestepBrickWidget extends AbstractBrickWidget<ActiveTimestepBrick> {
    constructor(protected $container: HTMLElement) {
        super($container, 'active-timestep-brick');
    }

    protected updateDom_brick() {
        if (this.brick) {
            this.$date!.innerText = Pretty.date(this.brick.date);
            this.$time!.innerText = Pretty.time(this.brick.date) + ' ' + Pretty.relativeHour(this.brick.date);;
            this.$title!.innerText = Pretty.relativeQuaterDay(this.brick.date);
            this.$root?.classList.remove(this.cssPrefix + '--morning', this.cssPrefix + '--day', this.cssPrefix + '--evening', this.cssPrefix + '--night');
            const hour = this.brick.date.getHours();
            if (hour < 6) {
                this.$root?.classList.add(this.cssPrefix + '--night');
            } else if (hour < 12) {
                this.$root?.classList.add(this.cssPrefix + '--morning');
            } else if (hour < 18) {
                this.$root?.classList.add(this.cssPrefix + '--day');
            } else {
                this.$root?.classList.add(this.cssPrefix + '--evening');
            }
        } else {
            this.$date!.innerText = '???';
            this.$time!.innerText = '???';
            this.$title!.innerText = '???';
        }
    }
}

