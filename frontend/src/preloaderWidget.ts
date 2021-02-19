import { ChartDatum } from './chartDatumWidget.js';
import { dateToHourstep, hourstepToDate } from './shared/frontend/chrono.js';
import { Pretty } from './shared/frontend/pretty.js';

export class PreloaderWidget {
    constructor(
      private $container: HTMLElement,
      private $root: HTMLElement,
      private $topText: HTMLElement,
      private $bottomText: HTMLElement,
      private $bar: HTMLElement,
      private $appRoot: HTMLElement,
      private cssPrefix:string = 'preloader') {
    }
    private isPreloaded: boolean = false;
    private preloadRatio: number = 0.1;
    private caption: string = 'Загрузка приложения';
    public setPreloadRatio(preloadRatio: number) {
      this.preloadRatio = preloadRatio;
      this.updateDom_preloadRatio();
    }
    private updateDom_preloadRatio() {
      this.$bottomText.innerText = (this.preloadRatio * 100).toFixed(0) + '%';
      this.$bar.style.width = (this.preloadRatio * 100).toFixed(2) + '%';
    }
    public setCaption(caption: string) {
      this.caption = caption;
      this.updateDom_caption();
    }
    private updateDom_caption() {
      this.$topText.innerText = this.caption;
    }
    public setIsPreloaded(isPreloaded: boolean) {
      this.isPreloaded = isPreloaded;
      this.updateDom_isPreloaded();
    }
    private updateDom_isPreloaded() {
      this.$appRoot.classList.toggle('app-root--is-preloaded', this.isPreloaded);
    }
}

