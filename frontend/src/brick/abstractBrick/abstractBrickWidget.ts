export abstract class AbstractBrickWidget<BrickG> {
    constructor(protected $container: HTMLElement, protected cssPrefix: string) {
        this.buildDom();
    }
    protected $root?: HTMLElement;
    protected $datetime?: HTMLElement;
    protected $date?: HTMLElement;
    protected $time?: HTMLElement;
    protected $dateTimeDelimiter?: HTMLElement;
    protected $title?: HTMLElement;
    protected $suptitle?: HTMLElement;
    protected $values?: HTMLElement;
    protected brick?: BrickG;
    protected isSelected: boolean = false;
    public ee: EventTarget = new EventTarget();
    public setBrick(brick: BrickG) {
        this.brick = brick;
        this.updateDom_brick();
    }
    public setIsSelected(isSelected: boolean) {
        this.isSelected = isSelected;
        this.updateDom_isSelected();
    }
    protected buildDom() {
        this.$root = document.createElement('div');
        this.$root.classList.add(this.cssPrefix + '');
        this.$datetime = document.createElement('div');
        this.$datetime.classList.add(this.cssPrefix + '__datetime');
        this.$date = document.createElement('div');
        this.$date.classList.add(this.cssPrefix + '__date');
        this.$time = document.createElement('div');
        this.$time.classList.add(this.cssPrefix + '__time');
        this.$dateTimeDelimiter = document.createElement('div');
        this.$dateTimeDelimiter.classList.add(this.cssPrefix + '__date-time-delimiter');
        this.$dateTimeDelimiter.innerText = ' ';
        this.$title = document.createElement('div');
        this.$title.classList.add(this.cssPrefix + '__title');
        this.$suptitle = document.createElement('div');
        this.$suptitle.classList.add(this.cssPrefix + '__suptitle');
        this.$values = document.createElement('div');
        this.$values.classList.add(this.cssPrefix + '__values');
        this.$datetime.appendChild(this.$date);
        this.$datetime.appendChild(this.$dateTimeDelimiter);
        this.$datetime.appendChild(this.$time);
        this.$root.appendChild(this.$datetime);
        this.$root.appendChild(this.$suptitle);
        this.$root.appendChild(this.$title);
        this.$root.appendChild(this.$values);

        this.$container.appendChild(this.$root);
        this.$root.addEventListener('click', () => {
            this.ee.dispatchEvent(new Event('click'));
        });
    }
    protected abstract updateDom_brick(): void;
    protected updateDom_isSelected() {
        this.$root!.classList.toggle(this.cssPrefix + '--selected', this.isSelected);
    }
}

