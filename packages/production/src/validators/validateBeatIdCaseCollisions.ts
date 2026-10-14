import { asArray, isRecord, pushViolation } from "@automovie/engine";
import type { IAutoMovieConstraintViolation } from "@automovie/interface";

/**
 * Append located findings for differently spelled beat ids sharing one ECMAScript lowercase spelling. The current resident script reader invokes this policy before keyed slice storage; required array, row and id admission remain with that reader's other gates.
 *
 * Exact duplicates remain with the separate uniqueness gate, so this pass reports only a spelling different from the first occurrence retained for that lowercase key.
 *
 * The historical policy folds raw ids rather than encoded filenames. It therefore refuses con/Con even though the store's device-stem escaping distinguishes their filenames; this helper preserves that stronger admission policy without changing authored ids.
 *
 * @evidence contracts/common.md#principled-implementation A map keyed by ECMAScript lowercase id detects differently spelled identities that collide under the project's portable case policy; equal duplicates stay with the separate uniqueness gate.
 * @evidence contracts/common.md#clear-and-simple-design One scan retains the first spelling and index for diagnostics; the current resident script reader owns its invocation and other shape/id gates.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No reserved name is excepted; the documented raw-id policy conservatively refuses con/Con even when filename escaping would distinguish them.
 * @evidence contracts/common.md#meaningful-documentation States the current reader, duplicate separation, first-occurrence addressing and the stronger raw-id policy.
 * @evidence contracts/performance.md#efficient-algorithms For B beat rows and total id length L, scanning and lowercasing take O(B+L) time and O(B+L) map storage; each row is read once.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The scan answers one supplied beat population and keeps no cross-read case index.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The case map is call-local; the caller owns appended findings, whose count is bounded by malformed collision rows.
 */
export function validateBeatIdCaseCollisions(beats: unknown, path: string, violations: IAutoMovieConstraintViolation[]): void {
  const byLower: Map<string, { id: string; index: number }> = new Map();
  asArray(beats).forEach((beat: unknown, index: number): void => {
    if (!isRecord(beat) || typeof beat.id !== "string") return;
    const lower: string = beat.id.toLowerCase();
    const prior: { id: string; index: number } | undefined = byLower.get(lower);
    if (prior !== undefined && prior.id !== beat.id)
      pushViolation(
        violations,
        "type",
        `${path}[${index}].id`,
        `beat id "${beat.id}" collides case-insensitively with "${prior.id}" (${path}[${prior.index}].id); their per-beat slice files would clobber on a case-insensitive filesystem, rename one beat`,
        beat.id,
      );
    if (prior === undefined) byLower.set(lower, { id: beat.id, index });
  });
}
