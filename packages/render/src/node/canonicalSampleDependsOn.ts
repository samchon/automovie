import type { Sample } from "mp4box";

/**
 * A sample's `depends_on` value with an unspecified dependency on a sync
 * sample read as 2, "depends on no other sample".
 *
 * The values follow ISO/IEC 14496-12 `sample_depends_on`: 0 unknown, 1
 * depends on others, 2 does not depend on others. mp4box reports 0 for every
 * sample of a file without a sample-dependency box, while its fragment writer
 * encodes every sync sample's flags as 2, so the same sync sample reads as 0
 * before a lossless splice and 2 after it. A sync sample cannot depend on
 * another sample, so 0 on a sync sample is mapped to 2; every other value is
 * returned as reported.
 *
 * @evidence contracts/common.md#principled-implementation The mapping follows the ISO meaning of a sync sample, which by definition decodes without reference to other samples, so declaring 2 for an unspecified sync dependency adds no information the sync flag did not already carry; the unresolved limitation is that mp4box's writer also drops non-sync dependency values from a source sample-dependency box, which this mapping does not reconcile.
 * @evidence contracts/common.md#clear-and-simple-design One expression normalizes the single field the parser and writer report differently for sync samples, and `sameSampleFlags`, its only caller, applies it to both sides.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The mapping reflects the ISO definition of a sync sample and the documented mp4box encoding, not a particular fixture, and non-sync values are never rewritten.
 * @evidence contracts/common.md#meaningful-documentation The doc gives the ISO value meanings, the parser and writer behavior that makes the mapping necessary, the exact mapping, and that other values pass through.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The function reads two fields and returns one number, so no algorithm or data structure is chosen.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A constant-time read of one sample coordinates no work between requests or phases.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The function keeps no reference to the sample and acquires nothing.
 */
export const canonicalSampleDependsOn = (sample: Sample): number =>
  sample.is_sync === true && sample.depends_on === 0 ? 2 : sample.depends_on;
