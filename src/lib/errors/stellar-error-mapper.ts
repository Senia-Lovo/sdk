/**
 * Stellar Error Mapper
 *
 * Maps errors thrown by the @stellar/stellar-sdk into SDK error classes so that
 * consumers always receive consistent, typed errors regardless of the underlying
 * Stellar SDK internals.
 *
 * ## Mapping table
 *
 * | Stellar SDK error                          | SDK error class   | Notes                                  |
 * |--------------------------------------------|-------------------|----------------------------------------|
 * | `BadResponseError` / `SubmissionError`      | `PaymentError`    | Transaction submission failures        |
 * | Network / fetch errors (no response)        | `NetworkError`    | Connection failures, DNS errors        |
 * | Timeout / AbortError                        | `TimeoutError`    | Request timed out before response      |
 * | `AccountRequiresMemoError`                  | `PaymentError`    | Destination requires a transaction memo|
 * | `NotFoundError` (horizon 404)               | `PaymentError`    | Account or resource not found on chain |
 * | Any other Stellar SDK error                 | `PaymentError`    | Catch-all for unknown Stellar errors   |
 *
 * The original Stellar SDK error is always attached as `cause` on the mapped
 * error so that callers can inspect raw Stellar details when needed:
 *
 * ```ts
 * try {
 *   await submitTransaction(request);
 * } catch (err) {
 *   if (err instanceof PaymentError) {
 *     console.error('Stellar cause:', (err as any).cause);
 *   }
 * }
 * ```
 */

import { NetworkError, PaymentError, TimeoutError } from '../../types/errors';

// ---------------------------------------------------------------------------
// Internal helpers – we duck-type against the Stellar SDK error shapes rather
// than importing concrete classes to avoid a tight version coupling.
// ---------------------------------------------------------------------------

/** A value that looks like an object (not null). */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Returns `true` when `err` appears to be a Stellar SDK `BadResponseError` or
 * `SubmissionError` – both carry a `response` property with the raw HTTP
 * response and an optional `extras` / `result_codes` block.
 */
function isStellarSubmissionError(err: unknown): boolean {
  if (!isObject(err)) return false;
  // Stellar SDK SubmissionError has `response.data.extras.result_codes`
  // BadResponseError has `response.status` and `response.statusText`
  return (
    'response' in err &&
    isObject((err as Record<string, unknown>).response)
  );
}

/**
 * Returns `true` when `err` resembles a network-level failure (no HTTP
 * response was received at all): fetch failures, ECONNREFUSED, DNS errors, etc.
 */
function isStellarNetworkError(err: unknown): boolean {
  if (!isObject(err)) return false;
  const name = (err as { name?: unknown }).name;
  const message = (err as { message?: unknown }).message ?? '';

  if (typeof name === 'string') {
    if (/network|connection|econnrefused|enotfound|dns/i.test(name)) return true;
    if (name === 'FetchError') return true;
  }
  if (typeof message === 'string') {
    if (/network|fetch failed|econnrefused|enotfound|failed to fetch|offline/i.test(message)) {
      return true;
    }
  }
  // The Stellar SDK sets `response` to `undefined` on network failures
  if ('response' in err && (err as Record<string, unknown>).response === undefined) {
    return true;
  }
  return false;
}

/**
 * Returns `true` when `err` is a timeout or abort error.
 */
function isStellarTimeoutError(err: unknown): boolean {
  if (!isObject(err)) return false;
  const name = (err as { name?: unknown }).name ?? '';
  const message = (err as { message?: unknown }).message ?? '';

  if (typeof name === 'string' && /timeout|aborterror/i.test(name)) return true;
  if (typeof message === 'string' && /timeout|timed out|aborted/i.test(message)) return true;
  return false;
}

/**
 * Returns `true` when `err` is an `AccountRequiresMemoError` from Stellar SDK.
 */
function isStellarAccountRequiresMemoError(err: unknown): boolean {
  if (!isObject(err)) return false;
  const name = (err as { name?: unknown }).name ?? '';
  return typeof name === 'string' && name === 'AccountRequiresMemoError';
}

/**
 * Extracts the transaction hash from a Stellar SDK error when available.
 * This lives in `err.response.data.hash` or `err.data.hash` depending on the
 * SDK version.
 */
function extractTransactionHash(err: unknown): string | undefined {
  if (!isObject(err)) return undefined;

  // Try response.data.hash (SubmissionError)
  const response = (err as Record<string, unknown>).response;
  if (isObject(response)) {
    const data = (response as Record<string, unknown>).data;
    if (isObject(data)) {
      const hash = (data as Record<string, unknown>).hash;
      if (typeof hash === 'string') return hash;
    }
  }

  // Try data.hash (some SDK versions)
  const data = (err as Record<string, unknown>).data;
  if (isObject(data)) {
    const hash = (data as Record<string, unknown>).hash;
    if (typeof hash === 'string') return hash;
  }

  // Try hash directly on the error
  const hash = (err as Record<string, unknown>).hash;
  if (typeof hash === 'string') return hash;

  return undefined;
}

/**
 * Extracts a human-readable message from a Stellar SDK error.
 * Prefers `result_codes` details when available.
 */
function extractStellarMessage(err: unknown): string {
  if (!isObject(err)) return 'Stellar transaction error';

  // Try result_codes from extras (SubmissionError)
  const response = (err as Record<string, unknown>).response;
  if (isObject(response)) {
    const data = (response as Record<string, unknown>).data;
    if (isObject(data)) {
      const extras = (data as Record<string, unknown>).extras;
      if (isObject(extras)) {
        const resultCodes = (extras as Record<string, unknown>).result_codes;
        if (isObject(resultCodes)) {
          const transaction = (resultCodes as Record<string, unknown>).transaction;
          const operations = (resultCodes as Record<string, unknown>).operations;
          const parts: string[] = [];
          if (typeof transaction === 'string') parts.push(transaction);
          if (Array.isArray(operations)) parts.push(...operations.map(String));
          if (parts.length > 0) {
            return `Stellar transaction failed: ${parts.join(', ')}`;
          }
        }
      }
    }
  }

  // Fall back to the error's own message
  const message = (err as { message?: unknown }).message;
  if (typeof message === 'string' && message.length > 0) return message;

  return 'Stellar transaction error';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Attaches the original Stellar error as the `cause` on a mapped SDK error.
 *
 * TypeScript's `Error.cause` is typed as `unknown` since ES2022. We attach it
 * here unconditionally so callers can always inspect the raw error.
 */
function withCause<T extends Error>(sdkError: T, cause: unknown): T {
  (sdkError as T & { cause: unknown }).cause = cause;
  return sdkError;
}

/**
 * Maps a raw error thrown by the `@stellar/stellar-sdk` into an SDK-typed
 * error class.
 *
 * - Submission failures → `PaymentError` (with `transactionHash` when available)
 * - Network failures    → `NetworkError`
 * - Timeout / aborts   → `TimeoutError`
 * - Everything else    → `PaymentError` (generic Stellar failure)
 *
 * The original Stellar error is always preserved as `.cause` on the returned
 * error.
 *
 * @param err - The raw error caught from a Stellar SDK call.
 * @returns    A typed SDK error that wraps the original Stellar error.
 *
 * @example
 * ```ts
 * import { mapStellarError } from '../lib/errors/stellar-error-mapper';
 *
 * try {
 *   await server.submitTransaction(tx);
 * } catch (err) {
 *   throw mapStellarError(err);
 * }
 * ```
 */
export function mapStellarError(err: unknown): PaymentError | NetworkError | TimeoutError {
  // Already an SDK error – return as-is (no double-wrapping)
  if (
    err instanceof PaymentError ||
    err instanceof NetworkError ||
    err instanceof TimeoutError
  ) {
    return err;
  }

  // Network-level failure (no HTTP response)
  if (isStellarNetworkError(err)) {
    const message = isObject(err)
      ? String((err as Record<string, unknown>).message ?? 'Network error contacting Stellar')
      : 'Network error contacting Stellar';
    return withCause(new NetworkError(message), err);
  }

  // Timeout / abort
  if (isStellarTimeoutError(err)) {
    const message = isObject(err)
      ? String((err as Record<string, unknown>).message ?? 'Stellar request timed out')
      : 'Stellar request timed out';
    return withCause(new TimeoutError(message), err);
  }

  // AccountRequiresMemoError
  if (isStellarAccountRequiresMemoError(err)) {
    return withCause(
      new PaymentError(
        'Destination account requires a transaction memo',
        400,
        'STELLAR_ACCOUNT_REQUIRES_MEMO'
      ),
      err
    );
  }

  // Submission error (BadResponseError / SubmissionError with a response body)
  if (isStellarSubmissionError(err)) {
    const hash = extractTransactionHash(err);
    const message = extractStellarMessage(err);
    return withCause(new PaymentError(message, 400, 'STELLAR_SUBMISSION_ERROR', hash), err);
  }

  // Generic / unknown Stellar SDK error
  const message = isObject(err)
    ? String((err as Record<string, unknown>).message ?? 'Stellar SDK error')
    : 'Stellar SDK error';

  return withCause(new PaymentError(message, 500, 'STELLAR_ERROR'), err);
}

/**
 * Wraps an async function that calls the Stellar SDK. Any error thrown is
 * automatically mapped through `mapStellarError`.
 *
 * @param fn - Async factory that calls Stellar SDK methods.
 * @returns    The resolved value of `fn`, or re-throws a mapped SDK error.
 *
 * @example
 * ```ts
 * const result = await withStellarErrorMapping(() =>
 *   server.submitTransaction(tx)
 * );
 * ```
 */
export async function withStellarErrorMapping<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    throw mapStellarError(err);
  }
}
