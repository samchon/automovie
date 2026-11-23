/** The content-digest grammar; it has no `g` flag, so `test` keeps no state. */
const DIGEST_PATTERN: RegExp = /^sha256:[0-9a-f]{64}$/;

/**
 * Whether a string is one SHA-256 content digest: `sha256:` followed by 64
 * lowercase hexadecimal digits.
 *
 * The render planner checks every runtime, compile and source digest it puts
 * into a chunk identity with this, and `normalizeAudioAssets` checks asset
 * digests. Uppercase hex and other algorithms are refused, because the digest
 * writers emit only this spelling and identities are compared as strings.
 */
export const validDigest: (value: string) => boolean = (
  value: string,
): boolean => DIGEST_PATTERN.test(value);
