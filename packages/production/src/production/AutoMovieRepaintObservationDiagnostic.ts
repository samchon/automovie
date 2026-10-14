

/**
 * Aggregate observation refusals. Admission errors return schema-invalid alone; admitted records can accumulate independent member-set, basis, artifact and incomplete-verdict causes. None of these metadata codes is fresh visual judgment.
 *
 * @evidence contracts/common.md#principled-implementation Separate schema, ordered membership, observation basis, artifact identity and completion categories preserve the exact persisted/current comparison that failed.
 * @evidence contracts/common.md#clear-and-simple-design Compact refusal codes separate currentness metadata from renderer/playback observations and artifact I/O.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Stored pass verdicts are not recast as a newly watched sequence and malformed admission does not generate misleading stale consequences.
 * @evidence contracts/common.md#meaningful-documentation Prose states schema-only early return versus independent admitted comparisons and the metadata-only boundary.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This union executes no schema traversal, hash or currentness comparison.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Code spelling implements no observation or artifact cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased type acquires no diagnostic arrays, media bytes or playback task.
 * @author Samchon
 */
export type AutoMovieRepaintObservationDiagnostic =
  | "observation-schema-invalid"
  | "observation-member-set-stale"
  | "observation-basis-stale"
  | "observation-artifact-stale"
  | "observation-incomplete";
