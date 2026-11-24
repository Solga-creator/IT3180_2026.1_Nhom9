/**
 * Base Observer Pattern (Domain Event Bus) kết nối các thao tác nghiệp vụ của Sprint 1
 * (nhân khẩu, biến động cư trú) với phân hệ Nhật ký kiểm toán (US-019) và Công nợ (US-012) của Sprint 2.
 */
class DomainEventBus {
  constructor() {
    this.listeners = new Map();
  }

  subscribe(eventName, observerFn) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName).add(observerFn);
    return () => this.unsubscribe(eventName, observerFn);
  }

  unsubscribe(eventName, observerFn) {
    const handlers = this.listeners.get(eventName);
    if (handlers) {
      handlers.delete(observerFn);
    }
  }

  async publish(eventName, payload) {
    const handlers = this.listeners.get(eventName);
    if (!handlers || handlers.size === 0) {
      return [];
    }
    const results = [];
    for (const handler of handlers) {
      results.push(await handler(payload));
    }
    return results;
  }
}

// Singleton instance dùng chung toàn hệ thống
export const domainEventBus = new DomainEventBus();
