import { AbstractBrick } from '../brick/abstractBrick/abstractBrick';
import { AbstractBrickWidget } from '../brick/abstractBrick/abstractBrickWidget';

export abstract class AbstractBricksWidget<AbstractBrickG extends AbstractBrick, AbstractBrickWidgetG extends AbstractBrickWidget<AbstractBrickG>> {
    constructor(protected $container: HTMLElement, protected cssPrefix: string) {
        this.buildDom();
    }
    protected $root?: HTMLElement;
    protected bricks?: AbstractBrickG[];
    protected bricksWidgets?: AbstractBrickWidgetG[];
    protected selectedAbstractBrickIdx: number = 0;
    public ee: EventTarget = new EventTarget();
    public setBricks(bricks: AbstractBrickG[]) {
        this.bricks = bricks;
        this.updateDom_bricks();
        this.setSelected(0);
    }
    protected buildDom() {
        this.$root = document.createElement('div');
        this.$root.classList.add(this.cssPrefix);

        this.$container.appendChild(this.$root);
    }
    protected setSelected(selectedAbstractBrickIdx: number) {
        this.selectedAbstractBrickIdx = selectedAbstractBrickIdx;
        if (this.bricksWidgets) {
            this.bricksWidgets.forEach((brickWidget, brickIdx ) => {
                const isSelected = this.selectedAbstractBrickIdx === brickIdx;
                brickWidget.setIsSelected(isSelected);
            });
            this.ee.dispatchEvent(new Event('select'));
        }
    }
    public getSelected(): number {
        return this.selectedAbstractBrickIdx;
    }
    protected abstract updateDom_bricks(): void;

}
