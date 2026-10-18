/**
 * Error Message Registry (Issue #163)
 *
 * Maps every error code in {@link ErrorCodes} to a human-readable message in
 * each supported locale.  This is the single source of truth for all
 * user-facing error strings tied to machine-readable codes.
 *
 * ## Supported locales
 *
 * | Locale | Language |
 * |--------|----------|
 * | `en`   | English  |
 * | `es`   | Spanish  |
 *
 * ## Usage
 *
 * Use the {@link getErrorMessage} helper rather than accessing `messages`
 * directly — it handles missing locales and missing codes gracefully.
 *
 * ```ts
 * import { getErrorMessage, ErrorCodes } from 'dorisio-sdk';
 *
 * const msg = getErrorMessage(ErrorCodes.AUTH_INVALID_TOKEN, 'es');
 * // → 'El token de autenticación es inválido o ha expirado.'
 * ```
 */

import type { ErrorCode } from './error-codes';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Supported locale identifiers. */
export type ErrorLocale = 'en' | 'es';

/** A record mapping every error code to its translation for a single locale. */
export type ErrorMessageMap = Record<ErrorCode, string>;

/** The full messages structure: `messages[locale][code]`. */
export type ErrorMessages = Record<ErrorLocale, ErrorMessageMap>;

// ---------------------------------------------------------------------------
// English messages
// ---------------------------------------------------------------------------

const en: ErrorMessageMap = {
  // Auth
  AUTH_INVALID_TOKEN: 'The authentication token is invalid or has expired.',
  AUTH_EXPIRED_SESSION: 'Your session has expired. Please log in again.',
  AUTH_INVALID_CREDENTIALS: 'The email address or password you entered is incorrect.',
  AUTH_REQUIRED: 'Authentication is required to perform this action.',
  AUTH_FORBIDDEN: 'You do not have permission to perform this action.',
  AUTH_REFRESH_TOKEN_INVALID: 'The refresh token is invalid or has been revoked.',

  // Validation
  VALIDATION_REQUIRED_FIELD: 'A required field is missing.',
  VALIDATION_INVALID_VALUE: 'The value provided for one or more fields is invalid.',
  VALIDATION_FAILED: 'The request could not be processed because the input is invalid.',
  VALIDATION_INVALID_AMOUNT: 'The amount must be a positive number greater than zero.',
  VALIDATION_MAX_EXCEEDED: 'A field value exceeds the maximum allowed limit.',

  // Network
  NETWORK_ERROR: 'A network error occurred. Please check your connection and try again.',
  NETWORK_TIMEOUT: 'The request timed out. Please try again.',
  NETWORK_CONNECTION_REFUSED: 'The connection was refused. The server may be unavailable.',
  NETWORK_DNS_FAILURE: 'The server could not be reached. Please check your network settings.',

  // Payments
  PAYMENT_FAILED: 'The payment could not be processed. Please try again.',
  PAYMENT_STELLAR_SUBMISSION_ERROR: 'The Stellar transaction was rejected. Please try again.',
  PAYMENT_INSUFFICIENT_FUNDS: 'Insufficient funds to complete this transaction.',
  PAYMENT_CREATE_TIP_FAILED: 'Failed to create the tip. Please try again.',
  PAYMENT_TRANSACTION_NOT_FOUND: 'The transaction was not found.',
  PAYMENT_ACCOUNT_REQUIRES_MEMO: 'The destination account requires a transaction memo.',

  // Wallets
  WALLET_INVALID_SIGNATURE: 'The wallet signature is invalid. Please try again.',
  WALLET_CHALLENGE_EXPIRED: 'The wallet verification challenge has expired. Please request a new one.',
  WALLET_ALREADY_LINKED: 'This wallet address is already linked to another account.',
  WALLET_NOT_FOUND: 'The requested wallet was not found.',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait a moment and try again.',
  RATE_QUEUE_FULL: 'The request queue is full. Please try again shortly.',

  // Server
  SERVER_ERROR: 'An unexpected server error occurred. Please try again later.',
  SERVER_NOT_FOUND: 'The requested resource was not found.',

  // SDK
  SDK_UNKNOWN: 'An unexpected error occurred.',
};

// ---------------------------------------------------------------------------
// Spanish messages
// ---------------------------------------------------------------------------

const es: ErrorMessageMap = {
  // Auth
  AUTH_INVALID_TOKEN: 'El token de autenticación es inválido o ha expirado.',
  AUTH_EXPIRED_SESSION: 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.',
  AUTH_INVALID_CREDENTIALS: 'El correo electrónico o la contraseña son incorrectos.',
  AUTH_REQUIRED: 'Se requiere autenticación para realizar esta acción.',
  AUTH_FORBIDDEN: 'No tienes permiso para realizar esta acción.',
  AUTH_REFRESH_TOKEN_INVALID: 'El token de actualización es inválido o ha sido revocado.',

  // Validation
  VALIDATION_REQUIRED_FIELD: 'Falta un campo obligatorio.',
  VALIDATION_INVALID_VALUE: 'El valor proporcionado para uno o más campos no es válido.',
  VALIDATION_FAILED: 'La solicitud no pudo procesarse porque los datos son inválidos.',
  VALIDATION_INVALID_AMOUNT: 'El importe debe ser un número positivo mayor que cero.',
  VALIDATION_MAX_EXCEEDED: 'El valor de un campo supera el límite máximo permitido.',

  // Network
  NETWORK_ERROR: 'Se produjo un error de red. Comprueba tu conexión e inténtalo de nuevo.',
  NETWORK_TIMEOUT: 'La solicitud ha agotado el tiempo de espera. Por favor, inténtalo de nuevo.',
  NETWORK_CONNECTION_REFUSED: 'La conexión fue rechazada. Es posible que el servidor no esté disponible.',
  NETWORK_DNS_FAILURE: 'No se pudo alcanzar el servidor. Comprueba la configuración de red.',

  // Payments
  PAYMENT_FAILED: 'No se pudo procesar el pago. Por favor, inténtalo de nuevo.',
  PAYMENT_STELLAR_SUBMISSION_ERROR: 'La transacción de Stellar fue rechazada. Por favor, inténtalo de nuevo.',
  PAYMENT_INSUFFICIENT_FUNDS: 'Fondos insuficientes para completar esta transacción.',
  PAYMENT_CREATE_TIP_FAILED: 'No se pudo crear la propina. Por favor, inténtalo de nuevo.',
  PAYMENT_TRANSACTION_NOT_FOUND: 'No se encontró la transacción.',
  PAYMENT_ACCOUNT_REQUIRES_MEMO: 'La cuenta de destino requiere un memo de transacción.',

  // Wallets
  WALLET_INVALID_SIGNATURE: 'La firma del monedero es inválida. Por favor, inténtalo de nuevo.',
  WALLET_CHALLENGE_EXPIRED: 'El desafío de verificación del monedero ha expirado. Solicita uno nuevo.',
  WALLET_ALREADY_LINKED: 'Esta dirección de monedero ya está vinculada a otra cuenta.',
  WALLET_NOT_FOUND: 'No se encontró el monedero solicitado.',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'Demasiadas solicitudes. Por favor, espera un momento e inténtalo de nuevo.',
  RATE_QUEUE_FULL: 'La cola de solicitudes está llena. Por favor, inténtalo de nuevo en breve.',

  // Server
  SERVER_ERROR: 'Se produjo un error inesperado en el servidor. Por favor, inténtalo más tarde.',
  SERVER_NOT_FOUND: 'No se encontró el recurso solicitado.',

  // SDK
  SDK_UNKNOWN: 'Se produjo un error inesperado.',
};

// ---------------------------------------------------------------------------
// Exported messages registry
// ---------------------------------------------------------------------------

/**
 * Full error message registry keyed by locale then by error code.
 *
 * Prefer using {@link getErrorMessage} over accessing this object directly.
 */
export const messages: ErrorMessages = { en, es };

// ---------------------------------------------------------------------------
// getErrorMessage utility
// ---------------------------------------------------------------------------

/**
 * Retrieves the human-readable message for a given error code and locale.
 *
 * Fallback behaviour:
 * 1. If the `locale` exists and contains the `code`, that message is returned.
 * 2. If the `locale` is missing or does not contain `code`, the English
 *    (`'en'`) message is returned as a fallback.
 * 3. If the `code` is not found in English either, a generic fallback message
 *    is returned so the function never throws.
 *
 * @param code   - A valid error code (e.g. `ErrorCodes.AUTH_INVALID_TOKEN` or
 *                 the raw string `'AUTH_INVALID_TOKEN'`).
 * @param locale - The desired locale.  Defaults to `'en'`.
 * @returns        The localised message string.
 *
 * @example
 * ```ts
 * import { getErrorMessage, ErrorCodes } from 'dorisio-sdk';
 *
 * // Spanish message
 * getErrorMessage(ErrorCodes.AUTH_INVALID_TOKEN, 'es');
 * // → 'El token de autenticación es inválido o ha expirado.'
 *
 * // Falls back to English for an unknown locale
 * getErrorMessage(ErrorCodes.AUTH_INVALID_TOKEN, 'fr' as ErrorLocale);
 * // → 'The authentication token is invalid or has expired.'
 *
 * // Returns a generic message for an unknown code
 * getErrorMessage('TOTALLY_UNKNOWN_CODE');
 * // → 'An unexpected error occurred.'
 * ```
 */
export function getErrorMessage(code: string, locale: string = 'en'): string {
  const localeMessages = messages[locale as ErrorLocale];
  if (localeMessages) {
    const message = localeMessages[code as ErrorCode];
    if (message) return message;
  }

  // Fallback to English
  const englishMessage = messages.en[code as ErrorCode];
  if (englishMessage) return englishMessage;

  // Ultimate fallback
  return messages.en.SDK_UNKNOWN;
}
