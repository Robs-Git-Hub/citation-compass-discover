
export class RateLimiter {
  private queue: (() => Promise<void>)[] = [];
  private isProcessing = false;
  private readonly delayMs: number;

  constructor(delayMs: number = 4000) { // 4 seconds for 15 RPM
    this.delayMs = delayMs;
  }

  async add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        await task();
        
        // Wait before processing next task (except for the last one)
        if (this.queue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, this.delayMs));
        }
      }
    }

    this.isProcessing = false;
  }

  clear(): void {
    this.queue = [];
  }
}
