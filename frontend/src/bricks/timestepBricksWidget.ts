import { TimestepBrick } from '../brick/timestepBrick/timestepBrick.js';
import { TimestepBrickWidget } from '../brick/timestepBrick/timestepBrickWidget.js';
import { AbstractBricksWidget } from './abstractBricksWidget.js';

export class TimestepBricksWidget extends AbstractBricksWidget<TimestepBrick, TimestepBrickWidget> {
    constructor(protected $container: HTMLElement) {
        super($container, 'timestep-bricks');
    }
    protected updateDom_bricks() {
        if (this.bricks) {
            this.$root!.innerText = '';
            this.bricksWidgets = this.bricks.map((brick, brickIdx ) => {
                const brickWidget = new TimestepBrickWidget(this.$root!);
                brickWidget.setBrick(brick);
                function fnFactory(that: TimestepBricksWidget, brickIdx: number): () => void {
                    return () => {
                        that.setSelected(brickIdx);
                    };
                }
                brickWidget.ee.addEventListener('click', fnFactory(this, brickIdx));
                return brickWidget;
            });
        } else {
            this.$root!.innerText = '???';
        }

    }

}
