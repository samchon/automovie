
import path from "node:path";

/**
 * Replace the host platform's native path separator with slash for emitted addresses.
 *
 * The split/join projection normalizes Windows backslashes on Windows; on POSIX it leaves backslash characters untouched. It does not resolve dot segments, validate relative ownership or sanitize a path from another platform.
 *
 * @evidence contracts/common.md#principled-implementation Native path.sep follows the paths this process constructs, preserving other characters. Project resolvers separately decide namespace admission and safe storage addresses.
 * @evidence contracts/common.md#clear-and-simple-design One string projection supplies portable diagnostic/generated spelling after native path construction, without becoming a second resolver.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only native separator characters are transformed; no malformed or outside-root address is admitted merely because it now uses slashes.
 * @evidence contracts/common.md#meaningful-documentation States platform-dependent transformation and its distinction from resolution, cross-platform parsing and ownership validation.
 * @evidence contracts/performance.md#efficient-algorithms Splitting and joining traverse path text and allocate segments plus output proportional to its length; no byte inventory or filesystem operation runs.
 * @evidence contracts/performance.md#reuse-equivalent-work The current string is projected directly with no retained cache or invalidation policy over project paths.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned string belongs to the caller and temporary segments expire; no handle or running task is acquired.
 */
export function normalizeSlash(
  value: string
): string { return value.split(path.sep).join("/"); }
