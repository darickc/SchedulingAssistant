// Performance optimization utilities

import { useMemo, useCallback, useRef, useEffect } from 'react';

// Debounce hook for search inputs
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttle hook for scroll events
export const useThrottle = <T>(value: T, delay: number): T => {
  const [throttledValue, setThrottledValue] = React.useState<T>(value);
  const lastExecuted = useRef<number>(Date.now());

  useEffect(() => {
    if (Date.now() >= lastExecuted.current + delay) {
      lastExecuted.current = Date.now();
      setThrottledValue(value);
    } else {
      const handler = setTimeout(() => {
        lastExecuted.current = Date.now();
        setThrottledValue(value);
      }, delay);

      return () => clearTimeout(handler);
    }
  }, [value, delay]);

  return throttledValue;
};

// Memoized search filter
export const useSearchFilter = <T>(
  items: T[],
  searchQuery: string,
  searchFields: (keyof T)[],
  delay: number = 300
) => {
  const debouncedQuery = useDebounce(searchQuery.toLowerCase(), delay);

  return useMemo(() => {
    if (!debouncedQuery.trim()) {
      return items;
    }

    return items.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        return value && String(value).toLowerCase().includes(debouncedQuery);
      })
    );
  }, [items, debouncedQuery, searchFields]);
};

// Pagination hook
export const usePagination = <T>(
  items: T[],
  itemsPerPage: number = 20
) => {
  const [currentPage, setCurrentPage] = React.useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, itemsPerPage]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    prevPage,
    resetPagination,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
};

// Virtual list hook for large datasets
export const useVirtualList = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  buffer: number = 5
) => {
  const [scrollTop, setScrollTop] = React.useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + buffer
  );

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
      top: (startIndex + index) * itemHeight,
    }));
  }, [items, startIndex, endIndex, itemHeight]);

  const totalHeight = items.length * itemHeight;

  return {
    visibleItems,
    totalHeight,
    startIndex,
    endIndex,
    setScrollTop,
  };
};

// Optimized contact sectioning
export const useContactSections = (contacts: any[], searchQuery: string = '') => {
  return useMemo(() => {
    // Filter contacts first if there's a search query
    const filteredContacts = searchQuery
      ? contacts.filter(contact =>
          contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.phone.includes(searchQuery)
        )
      : contacts;

    // Group by first letter
    const sections: Record<string, any[]> = {};
    
    filteredContacts.forEach(contact => {
      const firstLetter = contact.name[0]?.toUpperCase() || '#';
      if (!sections[firstLetter]) {
        sections[firstLetter] = [];
      }
      sections[firstLetter].push(contact);
    });

    // Convert to array and sort
    return Object.keys(sections)
      .sort()
      .map(letter => ({
        title: letter,
        data: sections[letter].sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .filter(section => section.data.length > 0);
  }, [contacts, searchQuery]);
};

// Cache utility for expensive operations
class CacheManager {
  private cache = new Map<string, { value: any; timestamp: number; ttl: number }>();

  set(key: string, value: any, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const performanceCache = new CacheManager();

// Memoized cache hook
export const useCachedValue = <T>(
  key: string,
  factory: () => T,
  ttl: number = 5 * 60 * 1000,
  deps: React.DependencyList = []
): T => {
  return useMemo(() => {
    const cached = performanceCache.get(key);
    if (cached !== null) {
      return cached;
    }

    const value = factory();
    performanceCache.set(key, value, ttl);
    return value;
  }, [key, ttl, ...deps]);
};

// Batch operations utility
export class BatchProcessor<T> {
  private batch: T[] = [];
  private batchSize: number;
  private timeout: number;
  private processor: (items: T[]) => Promise<void>;
  private timeoutId: NodeJS.Timeout | null = null;

  constructor(
    processor: (items: T[]) => Promise<void>,
    batchSize: number = 10,
    timeout: number = 1000
  ) {
    this.processor = processor;
    this.batchSize = batchSize;
    this.timeout = timeout;
  }

  add(item: T): void {
    this.batch.push(item);

    if (this.batch.length >= this.batchSize) {
      this.flush();
    } else {
      this.resetTimeout();
    }
  }

  private resetTimeout(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.flush();
    }, this.timeout);
  }

  private async flush(): Promise<void> {
    if (this.batch.length === 0) {
      return;
    }

    const items = [...this.batch];
    this.batch = [];

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    try {
      await this.processor(items);
    } catch (error) {
      console.error('Batch processing error:', error);
    }
  }

  async flushNow(): Promise<void> {
    await this.flush();
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private marks = new Map<string, number>();
  private measures = new Map<string, number>();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string): number {
    const startTime = this.marks.get(startMark);
    if (!startTime) {
      console.warn(`Start mark '${startMark}' not found`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.measures.set(name, duration);
    
    if (__DEV__) {
      console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  getMeasure(name: string): number | undefined {
    return this.measures.get(name);
  }

  clearMarks(): void {
    this.marks.clear();
  }

  clearMeasures(): void {
    this.measures.clear();
  }

  getReport(): Record<string, number> {
    return Object.fromEntries(this.measures);
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Database query optimization helpers
export const optimizeQuery = {
  // Limit results for pagination
  limit: (query: string, limit: number, offset: number = 0): string => {
    return `${query} LIMIT ${limit} OFFSET ${offset}`;
  },

  // Add indexes for common queries
  createIndexes: (): string[] => [
    'CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);',
    'CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);',
    'CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_time ON appointments(scheduled_time);',
    'CREATE INDEX IF NOT EXISTS idx_appointments_contact_id ON appointments(contact_id);',
    'CREATE INDEX IF NOT EXISTS idx_appointments_leader_id ON appointments(leader_id);',
    'CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);',
  ],

  // Optimized search query
  searchContacts: (query: string, limit: number = 50): string => `
    SELECT * FROM contacts 
    WHERE name LIKE ? OR phone LIKE ? 
    ORDER BY name 
    LIMIT ${limit}
  `,

  // Optimized appointments query with joins
  getAppointmentsWithDetails: (startDate: string, endDate: string): string => `
    SELECT 
      a.*,
      c.name as contact_name,
      c.phone as contact_phone,
      l.name as leader_name,
      l.role as leader_role,
      at.name as type_name,
      at.duration_minutes as type_duration
    FROM appointments a
    JOIN contacts c ON a.contact_id = c.id
    JOIN leaders l ON a.leader_id = l.id  
    JOIN appointment_types at ON a.type_id = at.id
    WHERE a.scheduled_time BETWEEN ? AND ?
    ORDER BY a.scheduled_time
  `,
};

export default {
  useDebounce,
  useThrottle,
  useSearchFilter,
  usePagination,
  useVirtualList,
  useContactSections,
  useCachedValue,
  performanceCache,
  BatchProcessor,
  performanceMonitor,
  optimizeQuery,
};