import type { AutoMovieDesignDerivationFailureCode } from "./AutoMovieDesignDerivationFailureCode";

/**
 * One named lineage/currentness problem with target, optional path and cause text.
 *
 * @evidence contracts/common.md#principled-implementation Inspection projects actual malformed/stale observations into code, logical target, optional path and actionable explanation.
 * @evidence contracts/common.md#clear-and-simple-design One result shape preserves record-specific failures while returning multiple problems without publishing repairs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reported problems cover supplied bases/output reads and optional resident paths, not an independently discovered complete project.
 * @evidence contracts/common.md#meaningful-documentation Defines null path for manifest-wide failures and concrete target/path causes for stale records.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record erases; inspection sorting, map lookups, basis hashing and output reads remain included in that owner's cost.
 * @evidence contracts/performance.md#reuse-equivalent-work A prior problem is not current authority; later inspection must refresh metadata/bytes rather than reuse equal explanation text.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller retains an input-sized problem array and strings, while no buffer, watcher or process handle is embedded.
 *
 * @author Samchon
 */
export interface IAutoMovieDesignDerivationProblem {
  /** Stable machine-readable refusal category. */
  code: AutoMovieDesignDerivationFailureCode;

  /** Logical target affected by the problem. */
  target: string;

  /** Affected project-relative path, when one exists. */
  path: string | null;

  /** Actionable refusal explanation. */
  message: string;
}
