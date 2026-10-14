import type { BigIntStats } from "node:fs";

/**
 * Encode an admitted native file's exact device/inode pair for comparison.
 *
 * @evidence contracts/common.md#principled-implementation Decimal BigInt components separated by NUL preserve the two-component identity without numeric narrowing.
 * @evidence contracts/common.md#clear-and-simple-design One key representation serves native file identity comparisons; observation and content validation remain with callers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Identity uses neither path nor timestamp and does not prove content equality or continued filesystem ownership.
 * @evidence contracts/common.md#meaningful-documentation States native-stat premise, component separator and identity-versus-content limits.
 * @evidence contracts/performance.md#efficient-algorithms String conversion and concatenation scale with the two decimal representations; no file bytes or directory entries are scanned.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Encoding a supplied stat snapshot owns no cross-request observation or cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a new key string escapes; the stat snapshot is not retained by this helper.
 */
export function productionProjectFileIdentityKey(status: BigIntStats): string {
    return `${status.dev}\0${status.ino}`;
}
