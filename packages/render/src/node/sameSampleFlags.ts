import type { Sample } from "mp4box";

/**
 * Whether two samples carry the same sync, dependency, redundancy and
 * subsample facts.
 *
 * The compared fields are `is_sync`, `is_leading`, `depends_on`, `is_depended_on`, `has_redundancy`, `degradation_priority` and the subsample table. A lossless splice must preserve them, so the splice proofs compare a written sample with its source through this function. Timing, size and payload are not compared here.
 *
 * @evidence contracts/common.md#principled-implementation Parsed ISO flag fields are compared exactly, including unknown dependency zero; the copying writer now preserves those declarations in its public fragment fields. Subsample tables use JSON equality because both sides come from the same parser with the same key order; reserved and padding bits unavailable on Sample are outside this comparison.
 * @evidence contracts/common.md#clear-and-simple-design The two splice proofs ask this question per sample, and the flag record of a refusal reads the same verdict, so one definition owns the field list.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown dependency zero is never promoted to a definite declaration to hide writer loss; every available flag and subsample field must match exactly.
 * @evidence contracts/common.md#meaningful-documentation The doc lists the exact compared fields, why lossless proofs need them equal, and the timing, payload and unavailable raw-bit facts outside this predicate.
 * @evidence contracts/performance.md#efficient-algorithms Cost is constant apart from serializing the two subsample tables, linear in their entries and empty for samples without a table.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call compares one sample pair once, so no earlier result applies.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The two JSON strings are temporaries and nothing is retained or opened.
 */
export const sameSampleFlags: (left: Sample, right: Sample) => boolean = (
  left: Sample,
  right: Sample,
): boolean =>
  left.is_sync === right.is_sync &&
  left.is_leading === right.is_leading &&
  left.depends_on === right.depends_on &&
  left.is_depended_on === right.is_depended_on &&
  left.has_redundancy === right.has_redundancy &&
  left.degradation_priority === right.degradation_priority &&
  JSON.stringify(left.subsamples ?? []) ===
    JSON.stringify(right.subsamples ?? []);
