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
 *
 * @evidence contracts/common.md#principled-implementation A fully anchored regular expression decides the fixed-length grammar exactly, and lowercase-only hex keeps one spelling per digest so string comparison is digest comparison.
 * @evidence contracts/common.md#clear-and-simple-design One predicate serves every digest check in the film planner; production and engine keep their own private copies of the same pattern, a cross-package duplication this file does not own.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No digest value is special-cased; the pattern is the content-digest spelling the SHA-256 identity writers produce.
 * @evidence contracts/common.md#meaningful-documentation The doc gives the exact grammar, its callers, and why other spellings are refused.
 * @evidence contracts/performance.md#efficient-algorithms One linear regular-expression test over at most 71 matched characters, against one module-level pattern that carries no `lastIndex` state between calls.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure predicate on one short string coordinates no phases, so there is no work to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The compiled pattern is one module constant for the process lifetime and each test allocates nothing, so retention stays at that single expression object.
 */
export const validDigest: (value: string) => boolean = (value: string): boolean =>
  DIGEST_PATTERN.test(value);
