import type {
  IAutoMovieMemoryPeaks,
  IAutoMovieMemoryUsage,
  IAutoMovieRecoveryLocalBinding,
  IAutoMovieRecoveryMeshSpool,
  IAutoMovieRecoveryModelCounts,
  IAutoMovieRecoveryOpenContinuation,
  IAutoMovieRecoveryReconstruction,
  IAutoMovieRecoveryTensorFamiliesInput,
} from "..";

/**
 * Generated geometry, its exact coefficient binding and current run
 * observations borrowed by createAutoMovieRecoveryArtifact for one publication
 * snapshot. Counts and memory probes run synchronously; memory updates peaks
 * before the peak record is read. The assembler retains geometry/report
 * references in its result, so publication must observe the same run state and
 * spool identities. Pair counts describe processing and retained coverage
 * separately; none proves source fidelity. started uses the host's monotonic
 * millisecond clock.
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

  /** Sample current generated vertex and triangle populations. */
  counts: () => IAutoMovieRecoveryModelCounts;

  /** Sample host memory byte populations and update observed peaks. */
  memory: () => IAutoMovieMemoryUsage;

  /** Read the run observed heap and resident byte peaks. */
  peaks: () => IAutoMovieMemoryPeaks;
}
