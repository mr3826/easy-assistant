import '@testing-library/jest-dom';

class MemoryStorage implements Storage {
  private readonly store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear() {
    this.store.clear();
  }

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }
}

class ResizeObserverMock implements ResizeObserver {
  disconnect() {}
  observe() {}
  unobserve() {}
}

const testGlobal = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
  localStorage: Storage;
  ResizeObserver: typeof ResizeObserver;
};

testGlobal.IS_REACT_ACT_ENVIRONMENT = true;

Object.defineProperty(testGlobal, 'localStorage', {
  configurable: true,
  value: new MemoryStorage(),
});

Object.defineProperty(testGlobal, 'ResizeObserver', {
  configurable: true,
  value: ResizeObserverMock,
});
