import type {
  IAutoMovieRecoveryLocalContinuationPreparationOperation,
  IAutoMovieRecoveryOpenReconstructionOperation,
  IAutoMovieRecoveryOpenRunDescriptionOperation,
  IAutoMovieRecoveryOpenRunsPreparationOperation,
  IAutoMovieCubicBezierCurve64,
} from "@automovie/interface";

import { normalizeRecoveryCourse as normalizeRecoveryCourseImplementation } from "./internal/normalizeRecoveryCourse";

import { describeRecoveryOpenRun as describeOpenRunImplementation } from "./internal/describeRecoveryOpenRun";
import { prepareRecoveryLocalContinuation as prepareLocalContinuationImplementation } from "./internal/prepareRecoveryLocalContinuation";
import { prepareRecoveryOpenRuns as prepareOpenRunsImplementation } from "./internal/prepareRecoveryOpenRuns";
import { reconstructRecoveryOpen as reconstructOpenImplementation } from "./internal/reconstructRecoveryOpen";

/** Describes and reconstructs open runs from saved section authority. */
export namespace AutoMovieRecoveryOpenRun {
  /**
   * Reports the saved curve names and fitting quality for an addressed run.
   *
   * Each address identifies a saved section and its open arc. The result
   * follows the address order and gives span count, missed targets and the
   * largest millimetre estimate when all fits have qualified estimates.
   * Negative estimates preserve the missing qualification as a diagnostic.
   */
  export function describeOpenRun(
    bundle: Parameters<IAutoMovieRecoveryOpenRunDescriptionOperation.Operation>[0],
    nodes: Parameters<IAutoMovieRecoveryOpenRunDescriptionOperation.Operation>[1],
  ): ReturnType<IAutoMovieRecoveryOpenRunDescriptionOperation.Operation> {
    return describeOpenRunImplementation(bundle, nodes);
  }

  /**
   * Prepares ordinary continuation maps after applying analytic ownership.
   *
   * The sidecar must address every adjacent saved station and each open arc.
   * Both endpoints, direction flags and orientation rows refer to the saved
   * section order. Analytic claims remove the corresponding ordinary pairs
   * and unresolved groups only after incidence admission. Incomplete,
   * overlapping or invalid incidence throws.
   */
  export function prepareLocalContinuation(
    bundle: Parameters<IAutoMovieRecoveryLocalContinuationPreparationOperation.Operation>[0],
    graph: Parameters<IAutoMovieRecoveryLocalContinuationPreparationOperation.Operation>[1],
    analytic: Parameters<IAutoMovieRecoveryLocalContinuationPreparationOperation.Operation>[2],
  ): ReturnType<IAutoMovieRecoveryLocalContinuationPreparationOperation.Operation> {
    return prepareLocalContinuationImplementation(bundle, graph, analytic);
  }

  /**
   * Reconstructs source-free open surfaces in metres from saved cubics.
   *
   * Supply complete adjacent incidence, finite positive sampling spacing in
   * millimetres and a safe-integer vertex budget of at least four per run.
   * Each run uses a shared normalized course phase and axial station chart.
   * Generation errors for a valid run remain in its report. Malformed
   * continuation admission throws before reconstruction starts.
   */
  export function reconstructOpen(
    bundle: Parameters<IAutoMovieRecoveryOpenReconstructionOperation.Operation>[0],
    graph: Parameters<IAutoMovieRecoveryOpenReconstructionOperation.Operation>[1],
  ): ReturnType<IAutoMovieRecoveryOpenReconstructionOperation.Operation> {
    return reconstructOpenImplementation(bundle, graph);
  }

  /**
   * Prepares outgoing and incoming edges for ordinary open runs.
   *
   * Supply a complete saved sidecar, a positive physical tolerance and
   * the requested quadratic or ruled operator. Each incidence is addressed
   * by its section and arc, and retains the pair order and reversal flag.
   * Unsupported groups remain explicit counts. Invalid admission throws.
   */
  export function prepareOpenRuns(
    bundle: Parameters<IAutoMovieRecoveryOpenRunsPreparationOperation.Operation>[0],
    graph: Parameters<IAutoMovieRecoveryOpenRunsPreparationOperation.Operation>[1],
    operator: Parameters<IAutoMovieRecoveryOpenRunsPreparationOperation.Operation>[2],
  ): ReturnType<IAutoMovieRecoveryOpenRunsPreparationOperation.Operation> {
    return prepareOpenRunsImplementation(bundle, graph, operator);
  }
  /**
   * Normalizes the phase widths of one saved open millimetre cubic.
   *
   * Pass true to reverse both span order and the controls within each span.
   * The returned phase widths cover the unit interval while coefficient
   * coordinates stay in millimetres. Closed or unrepresentable phases throw.
   */
  export function normalizeCourse(
    curve: IAutoMovieCubicBezierCurve64,
    reverse: boolean,
  ): IAutoMovieCubicBezierCurve64 {
    return normalizeRecoveryCourseImplementation(curve, reverse);
  }
}
