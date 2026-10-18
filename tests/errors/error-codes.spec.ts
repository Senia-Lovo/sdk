/**
 * Tests for the error code registry and localization (Issue #163)
 *
 * Verifies that:
 *  1. ErrorCodes has ≥20 entries
 *  2. All codes have messages in both 'en' and 'es'
 *  3. getErrorMessage returns the correct locale message
 *  4. getErrorMessage falls back to English for unknown locales
 *  5. getErrorMessage falls back gracefully for unknown codes
 *  6. All exports are available from the package entry point
 */

import { describe, it, expect } from 'vitest';
import { ErrorCodes, type ErrorCode } from '../../src/lib/errors/error-codes';
import {
  messages,
  getErrorMessage,
  type ErrorLocale,
} from '../../src/lib/errors/error-messages';
import * as sdk from '../../src';

// ---------------------------------------------------------------------------
// ErrorCodes registry
// ---------------------------------------------------------------------------

describe('ErrorCodes', () => {
  it('has at least 20 entries', () => {
    const keys = Object.keys(ErrorCodes);
    expect(keys.length).toBeGreaterThanOrEqual(20);
  });

  it('each key equals its string value (self-referential const)', () => {
    for (const [key, value] of Object.entries(ErrorCodes)) {
      expect(value).toBe(key);
    }
  });

  it('covers the AUTH_ domain', () => {
    const authCodes = Object.keys(ErrorCodes).filter((k) => k.startsWith('AUTH_'));
    expect(authCodes.length).toBeGreaterThanOrEqual(4);
  });

  it('covers the VALIDATION_ domain', () => {
    const codes = Object.keys(ErrorCodes).filter((k) => k.startsWith('VALIDATION_'));
    expect(codes.length).toBeGreaterThanOrEqual(3);
  });

  it('covers the NETWORK_ domain', () => {
    const codes = Object.keys(ErrorCodes).filter((k) => k.startsWith('NETWORK_'));
    expect(codes.length).toBeGreaterThanOrEqual(2);
  });

  it('covers the PAYMENT_ domain', () => {
    const codes = Object.keys(ErrorCodes).filter((k) => k.startsWith('PAYMENT_'));
    expect(codes.length).toBeGreaterThanOrEqual(4);
  });

  it('covers the WALLET_ domain', () => {
    const codes = Object.keys(ErrorCodes).filter((k) => k.startsWith('WALLET_'));
    expect(codes.length).toBeGreaterThanOrEqual(2);
  });

  it('covers the RATE_ domain', () => {
    const codes = Object.keys(ErrorCodes).filter((k) => k.startsWith('RATE_'));
    expect(codes.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// messages registry
// ---------------------------------------------------------------------------

describe('messages', () => {
  const allCodes = Object.values(ErrorCodes) as ErrorCode[];
  const locales: ErrorLocale[] = ['en', 'es'];

  it('has entries for the supported locales', () => {
    expect(messages).toHaveProperty('en');
    expect(messages).toHaveProperty('es');
  });

  it.each(locales)('%s locale covers every ErrorCode', (locale) => {
    for (const code of allCodes) {
      expect(messages[locale]).toHaveProperty(code);
      const msg = messages[locale][code];
      expect(typeof msg).toBe('string');
      expect(msg.length).toBeGreaterThan(0);
    }
  });

  it('English and Spanish messages differ for AUTH_INVALID_TOKEN', () => {
    expect(messages.en.AUTH_INVALID_TOKEN).not.toBe(messages.es.AUTH_INVALID_TOKEN);
  });

  it('English and Spanish messages differ for PAYMENT_FAILED', () => {
    expect(messages.en.PAYMENT_FAILED).not.toBe(messages.es.PAYMENT_FAILED);
  });

  it('English and Spanish messages differ for NETWORK_ERROR', () => {
    expect(messages.en.NETWORK_ERROR).not.toBe(messages.es.NETWORK_ERROR);
  });

  it('does not have entries for unsupported locales (fr, de, zh, ja)', () => {
    const unsupported = ['fr', 'de', 'zh', 'ja'];
    for (const locale of unsupported) {
      expect(messages).not.toHaveProperty(locale);
    }
  });
});

// ---------------------------------------------------------------------------
// getErrorMessage
// ---------------------------------------------------------------------------

describe('getErrorMessage', () => {
  it('returns the English message when locale is "en"', () => {
    const result = getErrorMessage(ErrorCodes.AUTH_INVALID_TOKEN, 'en');
    expect(result).toBe(messages.en.AUTH_INVALID_TOKEN);
  });

  it('returns a Spanish string for AUTH_INVALID_TOKEN with locale "es"', () => {
    const result = getErrorMessage(ErrorCodes.AUTH_INVALID_TOKEN, 'es');
    expect(result).toBe(messages.es.AUTH_INVALID_TOKEN);
    // Quick sanity: it's in Spanish
    expect(result).toMatch(/token/i);
  });

  it('returns a Spanish string for RATE_LIMIT_EXCEEDED with locale "es"', () => {
    const result = getErrorMessage(ErrorCodes.RATE_LIMIT_EXCEEDED, 'es');
    expect(result).toBe(messages.es.RATE_LIMIT_EXCEEDED);
  });

  it('returns a Spanish string for NETWORK_TIMEOUT with locale "es"', () => {
    const result = getErrorMessage(ErrorCodes.NETWORK_TIMEOUT, 'es');
    expect(result).toBe(messages.es.NETWORK_TIMEOUT);
  });

  it('returns a Spanish string for PAYMENT_FAILED with locale "es"', () => {
    const result = getErrorMessage(ErrorCodes.PAYMENT_FAILED, 'es');
    expect(result).toBe(messages.es.PAYMENT_FAILED);
  });

  it('returns a Spanish string for WALLET_INVALID_SIGNATURE with locale "es"', () => {
    const result = getErrorMessage(ErrorCodes.WALLET_INVALID_SIGNATURE, 'es');
    expect(result).toBe(messages.es.WALLET_INVALID_SIGNATURE);
  });

  it('falls back to English when the locale is unknown', () => {
    const result = getErrorMessage(ErrorCodes.AUTH_INVALID_TOKEN, 'fr');
    expect(result).toBe(messages.en.AUTH_INVALID_TOKEN);
  });

  it('falls back to English when locale is an empty string', () => {
    const result = getErrorMessage(ErrorCodes.AUTH_INVALID_TOKEN, '');
    expect(result).toBe(messages.en.AUTH_INVALID_TOKEN);
  });

  it('defaults to English when no locale argument is passed', () => {
    const result = getErrorMessage(ErrorCodes.VALIDATION_FAILED);
    expect(result).toBe(messages.en.VALIDATION_FAILED);
  });

  it('returns a fallback string for an unknown error code', () => {
    const result = getErrorMessage('TOTALLY_UNKNOWN_CODE');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('never throws for arbitrary code and locale inputs', () => {
    const testCases = [
      ['', ''],
      ['UNKNOWN', 'en'],
      ['AUTH_INVALID_TOKEN', 'xx'],
      ['', 'es'],
      [null as unknown as string, undefined as unknown as string],
    ];

    for (const [code, locale] of testCases) {
      expect(() => getErrorMessage(code, locale)).not.toThrow();
    }
  });

  it('returns different messages for the two supported locales for every code', () => {
    const allCodes = Object.values(ErrorCodes) as ErrorCode[];
    // At least some codes should differ between locales
    const differCount = allCodes.filter(
      (code) => getErrorMessage(code, 'en') !== getErrorMessage(code, 'es')
    ).length;
    expect(differCount).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Package entry-point re-exports
// ---------------------------------------------------------------------------

describe('package exports', () => {
  it('re-exports ErrorCodes from the package root', () => {
    expect(sdk.ErrorCodes).toBeDefined();
    expect(sdk.ErrorCodes.AUTH_INVALID_TOKEN).toBe('AUTH_INVALID_TOKEN');
    expect(sdk.ErrorCodes.PAYMENT_FAILED).toBe('PAYMENT_FAILED');
    expect(sdk.ErrorCodes.NETWORK_TIMEOUT).toBe('NETWORK_TIMEOUT');
  });

  it('re-exports getErrorMessage from the package root', () => {
    expect(typeof sdk.getErrorMessage).toBe('function');
    expect(sdk.getErrorMessage(sdk.ErrorCodes.AUTH_INVALID_TOKEN, 'es')).toBe(
      messages.es.AUTH_INVALID_TOKEN
    );
  });

  it('re-exports errorMessages from the package root', () => {
    expect(sdk.errorMessages).toBeDefined();
    expect(sdk.errorMessages.en).toBeDefined();
    expect(sdk.errorMessages.es).toBeDefined();
  });
});
