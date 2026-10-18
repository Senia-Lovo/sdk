/**
 * Tests for the Stellar error mapper (Issue #166)
 *
 * Covers ≥5 Stellar error scenarios:
 *  1. Submission error with result_codes
 *  2. Submission error with transaction hash
 *  3. Network / fetch failure
 *  4. Timeout / AbortError
 *  5. AccountRequiresMemoError
 *  6. Generic unknown Stellar SDK error
 *  7. SDK errors are passed through without double-wrapping
 *  8. withStellarErrorMapping wrapper
 */

import { describe, it, expect } from 'vitest';
import { mapStellarError, withStellarErrorMapping } from '../../src/lib/errors/stellar-error-mapper';
import { PaymentError, NetworkError, TimeoutError } from '../../src/types/errors';

// ---------------------------------------------------------------------------
// Helpers to construct fake Stellar SDK errors
// ---------------------------------------------------------------------------

function makeStellarSubmissionError(
  resultCodes: { transaction?: string; operations?: string[] } = { transaction: 'tx_failed' },
  hash?: string
): Error {
  const err = new Error('Transaction submission failed') as Error & Record<string, unknown>;
  err.name = 'BadResponseError';
  err['response'] = {
    status: 400,
    statusText: 'Bad Request',
    data: {
      hash,
      extras: {
        result_codes: resultCodes,
      },
    },
  };
  return err;
}

function makeNetworkError(message = 'Failed to fetch'): Error {
  const err = new Error(message);
  err.name = 'FetchError';
  return err;
}

function makeTimeoutError(name = 'AbortError'): Error {
  const err = new Error('Request timed out');
  err.name = name;
  return err;
}

function makeAccountRequiresMemoError(): Error {
  const err = new Error('Account requires memo');
  err.name = 'AccountRequiresMemoError';
  return err;
}

function makeGenericStellarError(message = 'Stellar SDK error'): Error {
  const err = new Error(message);
  err.name = 'StellarError';
  return err;
}

// ---------------------------------------------------------------------------
// mapStellarError
// ---------------------------------------------------------------------------

describe('mapStellarError', () => {
  // Scenario 1 – Submission error with result_codes
  it('maps a SubmissionError with result_codes to PaymentError', () => {
    const stellar = makeStellarSubmissionError({
      transaction: 'tx_failed',
      operations: ['op_underfunded'],
    });

    const mapped = mapStellarError(stellar);

    expect(mapped).toBeInstanceOf(PaymentError);
    expect(mapped.message).toMatch(/tx_failed/);
    expect(mapped.message).toMatch(/op_underfunded/);
    expect((mapped as PaymentError).code).toBe('STELLAR_SUBMISSION_ERROR');
  });

  // Scenario 2 – Submission error with transaction hash
  it('preserves transactionHash on the mapped PaymentError', () => {
    const stellar = makeStellarSubmissionError(
      { transaction: 'tx_bad_seq' },
      'abc123def456'
    );

    const mapped = mapStellarError(stellar);

    expect(mapped).toBeInstanceOf(PaymentError);
    expect((mapped as PaymentError).transactionHash).toBe('abc123def456');
  });

  // Scenario 3 – Network failure
  it('maps a network / fetch error to NetworkError', () => {
    const stellar = makeNetworkError('Failed to fetch');

    const mapped = mapStellarError(stellar);

    expect(mapped).toBeInstanceOf(NetworkError);
    expect(mapped.message).toMatch(/Failed to fetch/i);
  });

  it('maps an ECONNREFUSED error to NetworkError', () => {
    const err = new Error('ECONNREFUSED 127.0.0.1:8000');
    err.name = 'Error';
    (err as Error & Record<string, unknown>)['response'] = undefined;

    const mapped = mapStellarError(err);

    expect(mapped).toBeInstanceOf(NetworkError);
  });

  // Scenario 4 – Timeout / AbortError
  it('maps an AbortError to TimeoutError', () => {
    const stellar = makeTimeoutError('AbortError');

    const mapped = mapStellarError(stellar);

    expect(mapped).toBeInstanceOf(TimeoutError);
  });

  it('maps a TimeoutError name to TimeoutError', () => {
    const stellar = makeTimeoutError('TimeoutError');

    const mapped = mapStellarError(stellar);

    expect(mapped).toBeInstanceOf(TimeoutError);
  });

  // Scenario 5 – AccountRequiresMemoError
  it('maps AccountRequiresMemoError to PaymentError with STELLAR_ACCOUNT_REQUIRES_MEMO code', () => {
    const stellar = makeAccountRequiresMemoError();

    const mapped = mapStellarError(stellar);

    expect(mapped).toBeInstanceOf(PaymentError);
    expect((mapped as PaymentError).code).toBe('STELLAR_ACCOUNT_REQUIRES_MEMO');
    expect(mapped.message).toMatch(/memo/i);
  });

  // Scenario 6 – Generic unknown Stellar error
  it('maps an unknown Stellar SDK error to PaymentError', () => {
    const stellar = makeGenericStellarError('Some unknown Stellar error');

    const mapped = mapStellarError(stellar);

    expect(mapped).toBeInstanceOf(PaymentError);
    expect(mapped.message).toBe('Some unknown Stellar error');
    expect((mapped as PaymentError).code).toBe('STELLAR_ERROR');
  });

  it('handles non-Error objects gracefully', () => {
    const mapped = mapStellarError({ message: 'weird error' });

    expect(mapped).toBeInstanceOf(PaymentError);
  });

  it('handles string errors gracefully', () => {
    const mapped = mapStellarError('raw string error');

    expect(mapped).toBeInstanceOf(PaymentError);
  });

  it('handles null gracefully', () => {
    const mapped = mapStellarError(null);

    expect(mapped).toBeInstanceOf(PaymentError);
  });

  // Scenario 7 – SDK errors pass through without double-wrapping
  it('returns an existing PaymentError unchanged', () => {
    const original = new PaymentError('Already mapped', 400, 'PAYMENT_FAILED', 'hash-xyz');

    const result = mapStellarError(original);

    expect(result).toBe(original);
  });

  it('returns an existing NetworkError unchanged', () => {
    const original = new NetworkError('Already mapped');

    const result = mapStellarError(original);

    expect(result).toBe(original);
  });

  it('returns an existing TimeoutError unchanged', () => {
    const original = new TimeoutError('Already mapped');

    const result = mapStellarError(original);

    expect(result).toBe(original);
  });

  // Original error preserved as cause
  it('attaches the original Stellar error as .cause', () => {
    const stellar = makeStellarSubmissionError();

    const mapped = mapStellarError(stellar);

    expect((mapped as unknown as Record<string, unknown>).cause).toBe(stellar);
  });

  it('attaches cause for network errors', () => {
    const stellar = makeNetworkError('connection refused');

    const mapped = mapStellarError(stellar);

    expect((mapped as unknown as Record<string, unknown>).cause).toBe(stellar);
  });
});

// ---------------------------------------------------------------------------
// withStellarErrorMapping
// ---------------------------------------------------------------------------

describe('withStellarErrorMapping', () => {
  // Scenario 8 – wrapper function
  it('returns the resolved value when no error is thrown', async () => {
    const result = await withStellarErrorMapping(async () => 'success');

    expect(result).toBe('success');
  });

  it('maps a Stellar submission error thrown inside the callback', async () => {
    const stellar = makeStellarSubmissionError({ transaction: 'tx_insufficient_balance' });

    await expect(
      withStellarErrorMapping(async () => {
        throw stellar;
      })
    ).rejects.toBeInstanceOf(PaymentError);
  });

  it('maps a network error thrown inside the callback', async () => {
    const stellar = makeNetworkError('network unreachable');

    await expect(
      withStellarErrorMapping(async () => {
        throw stellar;
      })
    ).rejects.toBeInstanceOf(NetworkError);
  });

  it('maps a timeout error thrown inside the callback', async () => {
    const stellar = makeTimeoutError('AbortError');

    await expect(
      withStellarErrorMapping(async () => {
        throw stellar;
      })
    ).rejects.toBeInstanceOf(TimeoutError);
  });

  it('preserves the original error as .cause on the mapped error', async () => {
    const stellar = makeStellarSubmissionError();

    let caughtError: unknown;
    try {
      await withStellarErrorMapping(async () => {
        throw stellar;
      });
    } catch (err) {
      caughtError = err;
    }

    expect((caughtError as Record<string, unknown>).cause).toBe(stellar);
  });
});
