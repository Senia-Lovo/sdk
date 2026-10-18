/**
 * Error Code Registry (Issue #163)
 *
 * A canonical, machine-readable registry of every error code the SDK can
 * emit. Having a single source of truth here means that consumers can:
 *
 * - Build error-aware UIs that branch on `error.code` rather than on error
 *   message strings.
 * - Wire structured logging pipelines that group metrics by error code.
 * - Import type-safe constants instead of duplicating magic strings.
 *
 * ## Categories
 *
 * | Prefix      | Domain                           |
 * |-------------|----------------------------------|
 * | `AUTH_`     | Authentication and authorization |
 * | `VALIDATION_` | Input validation               |
 * | `NETWORK_`  | Network and connectivity         |
 * | `PAYMENT_`  | Payment processing               |
 * | `WALLET_`   | Wallet operations                |
 * | `RATE_`     | Rate limiting and throttling     |
 * | `SERVER_`   | Server / infrastructure errors   |
 * | `SDK_`      | SDK-level programming errors     |
 *
 * ## Usage
 *
 * ```ts
 * import { ErrorCodes } from 'dorisio-sdk';
 *
 * if (error.code === ErrorCodes.AUTH_INVALID_TOKEN) {
 *   redirectToLogin();
 * }
 * ```
 *
 * Every code that is **currently emitted** by an SDK error class is annotated
 * with which class uses it.  Codes marked **[reserved]** are documented for
 * use in future releases.
 */

/**
 * Canonical error code registry.
 *
 * All values are `const` strings — TypeScript will infer the exact literal
 * type of each entry so that narrowing on `error.code` works without a cast.
 */
export const ErrorCodes = {
  // -------------------------------------------------------------------------
  // Auth
  // -------------------------------------------------------------------------

  /** Token is missing, malformed, or has an invalid signature. Used by `AuthError`. */
  AUTH_INVALID_TOKEN: 'AUTH_INVALID_TOKEN',

  /** The session has expired and the user must re-authenticate. Used by `AuthenticationError`. */
  AUTH_EXPIRED_SESSION: 'AUTH_EXPIRED_SESSION',

  /** The credentials provided (email/password) are incorrect. Used by `AuthError`. */
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',

  /** A valid session / token is required but none was provided. Used by `AuthenticationError`. */
  AUTH_REQUIRED: 'AUTH_REQUIRED',

  /** The authenticated user does not have permission for this operation. Used by `AuthorizationError`. */
  AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',

  /** The refresh token is invalid or has been revoked. [reserved] */
  AUTH_REFRESH_TOKEN_INVALID: 'AUTH_REFRESH_TOKEN_INVALID',

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------

  /** One or more required fields are missing from the request. Used by `ValidationError`. */
  VALIDATION_REQUIRED_FIELD: 'VALIDATION_REQUIRED_FIELD',

  /** The value provided for a field is not within the allowed range or format. Used by `ValidationError`. */
  VALIDATION_INVALID_VALUE: 'VALIDATION_INVALID_VALUE',

  /** The overall request body failed schema validation. Used by `ValidationError`. */
  VALIDATION_FAILED: 'VALIDATION_FAILED',

  /** The amount field is zero, negative, or otherwise invalid. Used by `ValidationError`. */
  VALIDATION_INVALID_AMOUNT: 'VALIDATION_INVALID_AMOUNT',

  /** A field exceeds its maximum allowed length or value. [reserved] */
  VALIDATION_MAX_EXCEEDED: 'VALIDATION_MAX_EXCEEDED',

  // -------------------------------------------------------------------------
  // Network
  // -------------------------------------------------------------------------

  /** A network error occurred; no response was received. Used by `NetworkError`. */
  NETWORK_ERROR: 'NETWORK_ERROR',

  /** The request timed out before a response was received. Used by `TimeoutError`. */
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',

  /** The connection was refused or reset by the remote host. [reserved] */
  NETWORK_CONNECTION_REFUSED: 'NETWORK_CONNECTION_REFUSED',

  /** DNS resolution failed for the target host. [reserved] */
  NETWORK_DNS_FAILURE: 'NETWORK_DNS_FAILURE',

  // -------------------------------------------------------------------------
  // Payments
  // -------------------------------------------------------------------------

  /** A generic payment processing failure. Used by `PaymentError`. */
  PAYMENT_FAILED: 'PAYMENT_FAILED',

  /** The Stellar transaction was rejected during submission. Used by `PaymentError`. */
  PAYMENT_STELLAR_SUBMISSION_ERROR: 'PAYMENT_STELLAR_SUBMISSION_ERROR',

  /** The sender's account has insufficient funds. Used by `PaymentError`. */
  PAYMENT_INSUFFICIENT_FUNDS: 'PAYMENT_INSUFFICIENT_FUNDS',

  /** The tip could not be created. Used by `PaymentError`. */
  PAYMENT_CREATE_TIP_FAILED: 'PAYMENT_CREATE_TIP_FAILED',

  /** The transaction was not found (may have been dropped from the ledger). [reserved] */
  PAYMENT_TRANSACTION_NOT_FOUND: 'PAYMENT_TRANSACTION_NOT_FOUND',

  /** The destination account requires a transaction memo. Used by `PaymentError`. */
  PAYMENT_ACCOUNT_REQUIRES_MEMO: 'PAYMENT_ACCOUNT_REQUIRES_MEMO',

  // -------------------------------------------------------------------------
  // Wallets
  // -------------------------------------------------------------------------

  /** The wallet challenge signature is invalid. Used by `WalletVerificationError`. */
  WALLET_INVALID_SIGNATURE: 'WALLET_INVALID_SIGNATURE',

  /** The wallet verification challenge has expired. Used by `WalletVerificationError`. */
  WALLET_CHALLENGE_EXPIRED: 'WALLET_CHALLENGE_EXPIRED',

  /** The wallet address is already linked to another account. [reserved] */
  WALLET_ALREADY_LINKED: 'WALLET_ALREADY_LINKED',

  /** The requested wallet was not found. [reserved] */
  WALLET_NOT_FOUND: 'WALLET_NOT_FOUND',

  // -------------------------------------------------------------------------
  // Rate limiting
  // -------------------------------------------------------------------------

  /** Too many requests in a given time window. Used by `RateLimitError`. */
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  /** The request queue is full and the request was rejected. Used by `QueueFullError`. */
  RATE_QUEUE_FULL: 'RATE_QUEUE_FULL',

  // -------------------------------------------------------------------------
  // Server / infrastructure
  // -------------------------------------------------------------------------

  /** An unexpected server-side error occurred. Used by `ServerError`. */
  SERVER_ERROR: 'SERVER_ERROR',

  /** The requested resource was not found on the server. Used by `NotFoundError`. */
  SERVER_NOT_FOUND: 'SERVER_NOT_FOUND',

  // -------------------------------------------------------------------------
  // SDK
  // -------------------------------------------------------------------------

  /** An unknown or unclassified error. Catch-all for unexpected failures. */
  SDK_UNKNOWN: 'SDK_UNKNOWN',
} as const;

/**
 * Union type of all valid error code strings in the registry.
 *
 * @example
 * ```ts
 * function handleError(code: ErrorCode) {
 *   switch (code) {
 *     case ErrorCodes.AUTH_INVALID_TOKEN:
 *       // ...
 *   }
 * }
 * ```
 */
export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
