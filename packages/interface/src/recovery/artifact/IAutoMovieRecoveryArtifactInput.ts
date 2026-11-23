import type {
  IAutoMovieMemoryPeaks,
  IAutoMovieMemoryUsage,
  IAutoMovieRecoveryLocalBinding,
  IAutoMovieRecoveryMeshSpool,
  IAutoMovieRecoveryModelCounts,
  IAutoMovieRecoveryOpenContinuation,
  IAutoMovieRecoveryReconstruction,
  IAutoMovieRecoveryTensorFamiliesInput,
} from "../../index";

/**
 * Generated geometry, its exact coefficient binding and current run observations
 * borrowed by createAutoMovieRecoveryArtifact for one publication snapshot.
 * Counts and memory probes run synchronously; memory updates peaks before the
 * peak record is read. The assembler retains geometry/report references in its
 * result, so publication must observe the same run state and spool identities.
 * Pair counts describe processing and retained coverage separately; none proves
 * source fidelity. started uses the host's monotonic millisecond clock.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States borrowed geometry, synchronous probes, clock units, publication lifetime and separate processing/coverage claims.
 * @evidence contracts/development/design.md#principled-representation Existing reconstruction, spool, coefficient and binding records accompany explicit pair populations and observed host byte counters from the same run.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The artifact assembler reads these records without regenerating geometry; the reconstruction host owns run progress, output path and memory observation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The input does not infer absent domains or promote complete processing into visual fidelity; consistency between supplied counters and generated records remains the run owner's duty.
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

  /** Sample current generated vertex and triangle populations.
   * @evidence contracts/development/common.md#meaningful-documentation States the sampled quantities and owner-defined lifetime.
   */
  counts: () => IAutoMovieRecoveryModelCounts;

  /** Sample host memory byte populations and update observed peaks.
   * @evidence contracts/development/common.md#meaningful-documentation States the sampled quantities and owner-defined lifetime.
   */
  memory: () => IAutoMovieMemoryUsage;

  /** Read the run observed heap and resident byte peaks.
   * @evidence contracts/development/common.md#meaningful-documentation States the sampled quantities and owner-defined lifetime.
   */
  peaks: () => IAutoMovieMemoryPeaks;
}
