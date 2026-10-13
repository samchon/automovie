/**
 * A content digest as this project records it: `sha256:` followed by the 64
 * lowercase hexadecimal digits of the SHA-256 hash.
 *
 * Uppercase hex and other algorithms are refused rather than normalized, so
 * one set of bytes has exactly one spelling and two records of it compare equal
 * as strings. The design-reference, lineage and generated-acquisition
 * validators all test digests against this one pattern.
 */
export const SHA256_DIGEST_PATTERN: RegExp = /^sha256:[0-9a-f]{64}$/;
