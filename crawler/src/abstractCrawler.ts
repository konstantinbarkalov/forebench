import { EventEmitter } from 'events';

export class CrawlerError extends Error { };
export abstract class AbstractCrawler<valueG> {
  public abstract crawl(): Promise<valueG>;
}

abstract class AbstractAutoCrawler<valueG> extends AbstractCrawler<valueG> {
  public ee: NodeJS.EventEmitter = new EventEmitter();
  protected async crawlIteration(): Promise<void> {
    console.info('abstract crawler iteration!');
    const crawledData = await this.crawl();
    this.emitCrawled(crawledData);
  }
  protected emitCrawled(crawledData: valueG): void {
    this.ee.emit('crawled', crawledData);
  }
}

export abstract class AbstractAlignedAutoCrawler<valueG> extends AbstractAutoCrawler<valueG> {
  private timeout: NodeJS.Timeout | null = null;
  private lastAlignedIterationTimestamp: number = 0;
  public init(): void {
    console.info('abstract crawler init started...');
    this.scheduleCrawlIteration();
    console.info('abstract crawler init done!');
  }
  private scheduleCrawlIteration() {
    const alignedDelayMinutes = 30;
    if (this.timeout) {
      clearTimeout(this.timeout);
    };
    const now = Date.now();
    const alignedDelayMsec = 1000 * 60 * alignedDelayMinutes;
    const nextIterationTimestamp = (Math.floor(Math.max(now, this.lastAlignedIterationTimestamp) / alignedDelayMsec) + 1) * alignedDelayMsec;
    const dt = nextIterationTimestamp - now;
    console.info(`---------------------------------------------------`);
    console.info(`shedulling crawl in ${(dt / 1000 ).toFixed(0)} seconds!`);
    this.timeout = setTimeout(() => {
      this.lastAlignedIterationTimestamp = nextIterationTimestamp;
      this.crawlIteration();
      this.scheduleCrawlIteration();
    }, dt);
  }
}
export abstract class AbstractSerialAutoCrawler<valueG> extends AbstractAutoCrawler<valueG> {
  private timeout: NodeJS.Timeout | null = null;
  public init(): void {
    console.info('abstract crawler init started...');
    const delayMinutes = 30;
    if (this.timeout) {
      clearInterval(this.timeout);
    }
    this.timeout = setInterval(() => {
      this.crawlIteration();
    }, 1000 * 60 * delayMinutes);
    this.crawlIteration();
    console.info('abstract crawler init done!');
  }
}

