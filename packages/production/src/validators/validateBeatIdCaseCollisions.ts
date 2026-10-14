import { asArray, isRecord, pushViolation } from "@automovie/engine";
import type { IAutoMovieConstraintViolation } from "@automovie/interface";

/**
 * Beat ids whose per-beat slice filenames would clobber each other on a
 * case-insensitive filesystem (`shots/<beat>.json`, `beatEnds/<beat>.json`).
 *
 * Both gates over a script apply it: the commit gate, and the resident store's
 * `script.json` read gate. The read gate's whole population is files this
 * server did not write, or wrote under an older version, so a hand-edited or
 * legacy script carrying the collision used to load clean and resurface as the
 * store's raw mid-save throw at the SECOND colliding beat's `commitShot`, after
 * the non-keyed slices were rewritten. That is the exact symptom #1096 removed
 * for submitted scripts, reached from disk instead (#1327).
 *
 * Exact duplicates keep their own `validateUniqueBy` violation, so one bad pair
 * yields one violation rather than two.
 *
 * The fold is over the raw id, not over `sliceFilename`'s encoding of it. That
 * refuses a marginal pair the store would in fact tolerate (`con` and `Con`
 * escape to distinct filenames), which is the safe direction: relaxing a
 * refusal that has stood since #1096 needs a product reason, not a symmetry
 * argument.
 *
 * @evidence contracts/common.md#principled-implementation A map keyed by ECMAScript lowercase id detects differently spelled identities that collide under the project's portable case policy; equal duplicates stay with the separate uniqueness gate.
 * @evidence contracts/common.md#clear-and-simple-design One scan retains the first spelling and index for diagnostics and is shared by disk-read and commit admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No reserved name is excepted; the documented raw-id policy conservatively refuses con/Con even when filename escaping would distinguish them.
 * @evidence contracts/common.md#meaningful-documentation States both callers, duplicate separation, first-occurrence addressing and the conservative raw-id limitation.
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
