import type { Sample, createFile } from "mp4box";

/**
 * The `addSample` options that re-emit one parsed sample with its own timing
 * and dependency flags.
 *
 * Duration, decode time and composition time are copied in media ticks, with
 * the sync, leading, dependency, redundancy and degradation-priority flags and
 * the subsample table. The sample description index is not copied, so the
 * sample is written under the target track's first sample entry; every caller
 * writes a track with exactly one entry. Callers that re-time a sample spread
 * this record and replace the three time fields.
 *
 * @evidence contracts/common.md#principled-implementation The fields are the ISO sample-table and fragment-run facts that decide when a sample decodes and is presented and how it may be dropped, which is everything a lossless re-mux must preserve besides the payload and sample entry; the premise that one sample entry suffices holds because every caller opens a track from one source sample entry.
 * @evidence contracts/common.md#clear-and-simple-design The three writers that copy samples without decoding them, the normalizer, the feature mux and the lossless clip appender, read one field list, so a new flag is added once.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every value is copied as parsed, including `depends_on` 0 on a sync sample, which `canonicalSampleDependsOn` reconciles only on comparison; nothing is defaulted per caller.
 * @evidence contracts/common.md#meaningful-documentation The doc lists the copied fields and their unit, states that the description index is not copied and why that is safe, and how re-timing callers use the record.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Ten field copies into one object choose no algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each sample yields its own record, which is cheaper to build than to look up.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The record shares the sample's `subsamples` array by reference, so the writer that keeps the record keeps that array; nothing else is retained.
 */
export const sampleOptions = (
  sample: Sample,
): NonNullable<Parameters<ReturnType<typeof createFile>["addSample"]>[2]> => ({
  duration: sample.duration,
  cts: sample.cts,
  dts: sample.dts,
  is_sync: sample.is_sync,
  is_leading: sample.is_leading,
  depends_on: sample.depends_on,
  is_depended_on: sample.is_depended_on,
  has_redundancy: sample.has_redundancy,
  degradation_priority: sample.degradation_priority,
  subsamples: sample.subsamples,
});
