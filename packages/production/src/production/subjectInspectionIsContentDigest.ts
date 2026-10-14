import { SHA256_DIGEST_PATTERN } from "@automovie/engine";

/**
 * Check SHA-256 hexadecimal syntax on an already string-typed value.
 *
 * @evidence contracts/common.md#principled-implementation The shared non-global SHA256_DIGEST_PATTERN supplies runtime syntax admission.
 * @evidence contracts/common.md#clear-and-simple-design Plan/observation parsing share one pattern owner rather than copied regular expressions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The string predicate does not brand the public type or prove content provenance.
 * @evidence contracts/common.md#meaningful-documentation The Boolean answer is syntax only; actual byte/context agreement has separate owners.
 * @evidence contracts/performance.md#efficient-algorithms Regex matching follows supplied string length with no file read.
 * @evidence contracts/performance.md#reuse-equivalent-work One module pattern is reused without global lastIndex state or cached value decisions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No owned resource or string history survives the returned Boolean.
 */
export function subjectInspectionIsContentDigest(
  value: string
): value is string { return SHA256_DIGEST_PATTERN.test(value); }
