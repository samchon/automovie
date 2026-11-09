import type { IAutoMovieRecoveryOpenContinuation } from "../curve/IAutoMovieRecoveryOpenContinuation";
import type { IAutoMovieRecoveryReconstruction } from "../domain/IAutoMovieRecoveryReconstruction";
import type { IAutoMovieRecoveryTensorFamiliesInput } from "../domain/IAutoMovieRecoveryTensorFamiliesInput";
import type { IAutoMovieRecoveryLocalBinding } from "./IAutoMovieRecoveryLocalBinding";
import type { IAutoMovieRecoveryMemoryPeaks } from "./IAutoMovieRecoveryMemoryPeaks";
import type { IAutoMovieRecoveryMemoryUsage } from "./IAutoMovieRecoveryMemoryUsage";
import type { IAutoMovieRecoveryMeshSpool } from "./IAutoMovieRecoveryMeshSpool";
import type { IAutoMovieRecoveryModelCounts } from "./IAutoMovieRecoveryModelCounts";

/**
 * Already generated geometry, source-free input binding and current publication observations.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields preserve the existing publication, ownership and qualification quantities without changing runtime values.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One independently named record is shared by its producer and consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declaration infers no observations, supplies no geometry and changes no admission policy.
 * @evidence contracts/development/common.md#meaningful-documentation Members state byte, population, ownership, presence and qualification meanings.
 */
export interface IAutoMovieRecoveryArtifactInput {
  /** Already generated immutable closed and analytic base. */
  base: IAutoMovieRecoveryReconstruction;

  /** Current bounded open-mesh spool. */
  spool: IAutoMovieRecoveryMeshSpool;

  /** Saved curve and tensor coefficient authority. */
  bundle: IAutoMovieRecoveryTensorFamiliesInput;

  /** Saved source-free ordinary open continuation. */
  graph: IAutoMovieRecoveryOpenContinuation;

  /** Exact generating input binding. */
  binding: IAutoMovieRecoveryLocalBinding;

  /** Actual run generation reports. */
  runs: readonly object[];

  /** Declared ordinary pair population. */
  pairs: number;

  /** Processed ordinary pair population. */
  completedPairs: number;

  /** Pair population belonging to failed runs. */
  failedRunPairs: number;

  /** Intervals omitted by the generating engine. */
  omittedIntervals: number;

  /** Unsupported declared graph groups. */
  unsupportedGroups: number;

  /** Unsupported groups containing open arcs. */
  unsupportedGroupsWithOpenArcs: number;

  /** Pairs included in this publication. */
  publishedPairs: number;

  /** Current attempt completion observation. */
  complete: boolean;

  /** Monotonic start timestamp in milliseconds. */
  started: number;

  /** Owning output directory. */
  output: string;

  /**
   * Sample current generated vertex and triangle populations.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The implementation samples current run-owned counters without generating geometry.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The callback exposes the publication owner current observations.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No estimate, replacement geometry or inferred completion is supplied.
   * @evidence contracts/development/common.md#meaningful-documentation States the sampled quantities and owner-defined lifetime.
   * @evidence contracts/development/implementation.md#efficient-algorithms Reads a fixed set of counters or host memory populations without traversing generated geometry.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the run counters and observed peaks rather than recounting geometry.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The callback belongs to the active reconstruction run and returns a fresh small record without retaining it.
   */
  counts: () => IAutoMovieRecoveryModelCounts;

  /**
   * Sample host memory byte populations and update observed peaks.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The implementation samples current run-owned counters without generating geometry.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The callback exposes the publication owner current observations.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No estimate, replacement geometry or inferred completion is supplied.
   * @evidence contracts/development/common.md#meaningful-documentation States the sampled quantities and owner-defined lifetime.
   * @evidence contracts/development/implementation.md#efficient-algorithms Reads a fixed set of counters or host memory populations without traversing generated geometry.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the run counters and observed peaks rather than recounting geometry.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The callback belongs to the active reconstruction run and returns a fresh small record without retaining it.
   */
  memory: () => IAutoMovieRecoveryMemoryUsage;

  /**
   * Read the run observed heap and resident byte peaks.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The implementation samples current run-owned counters without generating geometry.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The callback exposes the publication owner current observations.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No estimate, replacement geometry or inferred completion is supplied.
   * @evidence contracts/development/common.md#meaningful-documentation States the sampled quantities and owner-defined lifetime.
   * @evidence contracts/development/implementation.md#efficient-algorithms Reads a fixed set of counters or host memory populations without traversing generated geometry.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the run counters and observed peaks rather than recounting geometry.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The callback belongs to the active reconstruction run and returns a fresh small record without retaining it.
   */
  peaks: () => IAutoMovieRecoveryMemoryPeaks;
}
