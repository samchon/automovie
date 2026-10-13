import type { Sample } from "mp4box";

import { canonicalSampleDependsOn } from "./canonicalSampleDependsOn";

/**
 * Whether two samples carry the same sync, dependency, redundancy and
 * subsample facts.
 *
 * The compared fields are `is_sync`, `is_leading`, `depends_on` read through
 * `canonicalSampleDependsOn`, `is_depended_on`, `has_redundancy`,
 * `degradation_priority` and the subsample table. A lossless splice must
 * preserve them, so the splice proofs compare a written sample with its source
 * through this function. Timing, size and payload are not compared here.
 *
 * @evidence contracts/common.md#principled-implementation The fields are the ISO sample flags and subsample information a decoder or player may act on, and an unspecified sync-sample dependency is read canonically because mp4box's writer encodes it as 2 while its parser reports a missing dependency table as 0; the subsample tables are compared by their JSON text, which is exact because both sides come from the same parser and so list the same keys in the same order.
 * @evidence contracts/common.md#clear-and-simple-design The two splice proofs ask this question per sample, and the flag record of a refusal reads the same verdict, so one definition owns the field list.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only the documented sync-dependency encoding difference is reconciled, through its named owner; every other field must match exactly.
 * @evidence contracts/common.md#meaningful-documentation The doc lists the compared fields, the canonical reading of one of them, why a splice needs them equal, and what is not compared.
 * @evidence contracts/performance.md#efficient-algorithms Cost is constant apart from serializing the two subsample tables, linear in their entries and empty for samples without a table.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call compares one sample pair once, so no earlier result applies.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The two JSON strings are temporaries and nothing is retained or opened.
 */
export const sameSampleFlags = (left: Sample, right: Sample): boolean =>
  left.is_sync === right.is_sync &&
  left.is_leading === right.is_leading &&
  canonicalSampleDependsOn(left) === canonicalSampleDependsOn(right) &&
  left.is_depended_on === right.is_depended_on &&
  left.has_redundancy === right.has_redundancy &&
  left.degradation_priority === right.degradation_priority &&
  JSON.stringify(left.subsamples ?? []) ===
    JSON.stringify(right.subsamples ?? []);
