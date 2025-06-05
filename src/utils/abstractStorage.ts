
export interface AbstractUnavailableEntry {
  paperId: string;
  timestamp: number;
  expirationDays: number;
}

export class AbstractStorage {
  private static readonly STORAGE_KEY = 'abstractsUnavailable';
  private static readonly DEFAULT_EXPIRATION_DAYS = 30;

  static markAsUnavailable(paperId: string): void {
    const entry: AbstractUnavailableEntry = {
      paperId,
      timestamp: Date.now(),
      expirationDays: this.DEFAULT_EXPIRATION_DAYS
    };

    const existingData = this.getAllUnavailable();
    existingData[paperId] = entry;
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingData));
    
    if (import.meta.env.DEV) {
      console.log(`Marked abstract as unavailable for paper: ${paperId}`);
    }
  }

  static isMarkedAsUnavailable(paperId: string): boolean {
    const entry = this.getUnavailableEntry(paperId);
    if (!entry) return false;

    // Check if entry has expired
    const daysSinceMarked = (Date.now() - entry.timestamp) / (1000 * 60 * 60 * 24);
    if (daysSinceMarked > entry.expirationDays) {
      this.removeUnavailable(paperId);
      return false;
    }

    return true;
  }

  private static getUnavailableEntry(paperId: string): AbstractUnavailableEntry | null {
    const data = this.getAllUnavailable();
    return data[paperId] || null;
  }

  private static getAllUnavailable(): Record<string, AbstractUnavailableEntry> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error reading abstract unavailable data from localStorage:', error);
      }
      return {};
    }
  }

  private static removeUnavailable(paperId: string): void {
    const data = this.getAllUnavailable();
    delete data[paperId];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  static clearExpiredEntries(): void {
    const data = this.getAllUnavailable();
    const now = Date.now();
    let hasChanges = false;

    for (const [paperId, entry] of Object.entries(data)) {
      const daysSinceMarked = (now - entry.timestamp) / (1000 * 60 * 60 * 24);
      if (daysSinceMarked > entry.expirationDays) {
        delete data[paperId];
        hasChanges = true;
      }
    }

    if (hasChanges) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      if (import.meta.env.DEV) {
        console.log('Cleared expired abstract unavailable entries');
      }
    }
  }
}
