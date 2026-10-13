import { posix } from "./posix";

/**
 * Normalize slash separators, repeated leading dot-slash prefixes and one trailing slash for selector matching.
 *
 * @evidence contracts/common.md#principled-implementation Normalize slash separators, repeated leading dot-slash prefixes and one trailing slash for selector matching.
 * @evidence contracts/common.md#clear-and-simple-design Glob normalization stays independent from filesystem boundary admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Interior dot segments are not resolved or admitted here; callers own confinement checks.
 * @evidence contracts/common.md#meaningful-documentation The result remains a glob pattern, with its wildcard spelling preserved.
 * @evidence contracts/performance.md#efficient-algorithms Separator replacement is linear in text length; repeated leading-prefix slicing can incur repeated string work.
 * @evidence contracts/performance.md#reuse-equivalent-work The same normalizer is reused by matching and manifest routing without cross-call cached patterns.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary strings are call-local and no compiled-pattern registry is retained.
 */
export function normalizeGlob(source: string): string {
  let output: string = posix(source);
  while (output.startsWith("./")) output = output.slice(2);
  if (output.endsWith("/")) output = output.slice(0, -1);
  return output;
}
