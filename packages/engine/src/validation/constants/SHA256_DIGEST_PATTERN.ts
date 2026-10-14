/**
 * A content digest as this project records it: `sha256:` followed by the 64 lowercase hexadecimal digits of the SHA-256 hash.
 *
 * Uppercase hex and other algorithms are refused rather than normalized, so one set of bytes has exactly one spelling and two records of it compare equal as strings. Engine validators that check a recorded digest test it against this one pattern instead of keeping their own copy. Matching proves representation only, never that referenced bytes exist or hash to this value. The pattern has no global or sticky flag, so repeated tests are independent.
 */
export const SHA256_DIGEST_PATTERN: RegExp = /^sha256:[0-9a-f]{64}$/;
