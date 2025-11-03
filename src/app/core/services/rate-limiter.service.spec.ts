/**
 * Unit tests for Rate Limiter Service
 */

import { TestBed } from '@angular/core/testing';
import { RateLimiterService } from './rate-limiter.service';

describe('RateLimiterService', () => {
  let service: RateLimiterService;
  const STORAGE_KEY = 'url-shortener-rate-limit';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RateLimiterService]
    });
    service = TestBed.inject(RateLimiterService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('canMakeRequest', () => {
    it('should return true initially', () => {
      expect(service.canMakeRequest()).toBe(true);
    });

    it('should return false when tokens are exhausted', () => {
      // Exhaust all tokens
      for (let i = 0; i < 50; i++) {
        service.recordRequest();
      }
      expect(service.canMakeRequest()).toBe(false);
    });

    it('should return true after reset', () => {
      for (let i = 0; i < 50; i++) {
        service.recordRequest();
      }
      expect(service.canMakeRequest()).toBe(false);

      service.reset();
      expect(service.canMakeRequest()).toBe(true);
    });
  });

  describe('recordRequest', () => {
    it('should decrement available tokens', () => {
      const initialTokens = service.getRemainingRequests();
      service.recordRequest();
      expect(service.getRemainingRequests()).toBe(initialTokens - 1);
    });

    it('should not decrement below zero', () => {
      for (let i = 0; i < 60; i++) {
        service.recordRequest();
      }
      expect(service.getRemainingRequests()).toBe(0);
    });

    it('should persist state to localStorage', () => {
      service.recordRequest();
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeTruthy();

      if (stored) {
        const state = JSON.parse(stored);
        expect(state.tokens).toBeLessThan(50);
      }
    });
  });

  describe('getRemainingRequests', () => {
    it('should return 50 initially', () => {
      expect(service.getRemainingRequests()).toBe(50);
    });

    it('should return correct count after requests', () => {
      service.recordRequest();
      service.recordRequest();
      service.recordRequest();
      expect(service.getRemainingRequests()).toBe(47);
    });

    it('should never return negative values', () => {
      for (let i = 0; i < 60; i++) {
        service.recordRequest();
      }
      expect(service.getRemainingRequests()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getTimeUntilRefill', () => {
    it('should return a positive number', () => {
      expect(service.getTimeUntilRefill()).toBeGreaterThan(0);
    });

    it('should return value less than or equal to window', () => {
      const timeUntilRefill = service.getTimeUntilRefill();
      const oneHourMs = 60 * 60 * 1000;
      expect(timeUntilRefill).toBeLessThanOrEqual(oneHourMs);
    });
  });

  describe('reset', () => {
    it('should reset tokens to maximum', () => {
      service.recordRequest();
      service.recordRequest();
      service.reset();
      expect(service.getRemainingRequests()).toBe(50);
    });

    it('should allow requests after reset', () => {
      for (let i = 0; i < 50; i++) {
        service.recordRequest();
      }
      expect(service.canMakeRequest()).toBe(false);

      service.reset();
      expect(service.canMakeRequest()).toBe(true);
    });

    it('should update localStorage', () => {
      service.reset();
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeTruthy();

      if (stored) {
        const state = JSON.parse(stored);
        expect(state.tokens).toBe(50);
      }
    });
  });

  describe('localStorage persistence', () => {
    it('should load state from localStorage on creation', () => {
      const state = {
        tokens: 25,
        lastRefill: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

      const newService = new RateLimiterService();
      expect(newService.getRemainingRequests()).toBe(25);
    });

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid-json');
      const newService = new RateLimiterService();
      expect(newService.getRemainingRequests()).toBe(50);
    });

    it('should handle missing localStorage data', () => {
      const newService = new RateLimiterService();
      expect(newService.getRemainingRequests()).toBe(50);
    });

    it('should handle invalid state structure', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ invalid: 'data' }));
      const newService = new RateLimiterService();
      expect(newService.getRemainingRequests()).toBe(50);
    });
  });

  describe('token refill', () => {
    it('should refill tokens after time window', () => {
      // Record some requests
      service.recordRequest();
      service.recordRequest();
      expect(service.getRemainingRequests()).toBe(48);

      // Simulate time passing by manipulating state
      const state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      state.lastRefill = Date.now() - (60 * 60 * 1000 + 1000); // Over 1 hour ago
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

      // Check that tokens are refilled
      expect(service.getRemainingRequests()).toBe(50);
    });
  });
});
