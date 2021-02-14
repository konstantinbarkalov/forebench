import { ProviderBrick } from '../brick/providerBrick/providerBrick.js';
import { ProviderBrickWidget } from '../brick/providerBrick/providerBrickWidget.js';
import { AbstractBricksWidget } from './abstractBricksWidget.js';


export class ProviderBricksWidget extends AbstractBricksWidget<ProviderBrick, ProviderBrickWidget> {
    constructor(protected $container: HTMLElement) {
        super($container, 'provider-bricks');
    }
    protected updateDom_bricks() {
        if (this.bricks) {
            this.$root!.innerText = '';
            this.bricksWidgets = this.bricks.map((brick, brickIdx ) => {
                const brickWidget = new ProviderBrickWidget(this.$root!);
                brickWidget.setBrick(brick);
                function fnFactory(that: ProviderBricksWidget, brickIdx: number): () => void {
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
