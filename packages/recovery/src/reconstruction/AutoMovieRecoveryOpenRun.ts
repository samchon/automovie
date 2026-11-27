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

/** Admit, describe, and reconstruct source-free Recovery open runs. */
export namespace AutoMovieRecoveryOpenRun {
  /** Describe the saved curves and fit metadata addressed by a run. */
  export function describeOpenRun(
    bundle: Parameters<IAutoMovieRecoveryOpenRunDescriptionOperation.Operation>[0],
    nodes: Parameters<IAutoMovieRecoveryOpenRunDescriptionOperation.Operation>[1],
  ): ReturnType<IAutoMovieRecoveryOpenRunDescriptionOperation.Operation> {
    return describeOpenRunImplementation(bundle, nodes);
  }

  /** Prepare immutable continuation maps for local open-surface emission. */
  export function prepareLocalContinuation(
    bundle: Parameters<IAutoMovieRecoveryLocalContinuationPreparationOperation.Operation>[0],
    graph: Parameters<IAutoMovieRecoveryLocalContinuationPreparationOperation.Operation>[1],
    analytic: Parameters<IAutoMovieRecoveryLocalContinuationPreparationOperation.Operation>[2],
  ): ReturnType<IAutoMovieRecoveryLocalContinuationPreparationOperation.Operation> {
    return prepareLocalContinuationImplementation(bundle, graph, analytic);
  }

  /** Reconstruct source-free open runs from saved cubics and continuation edges. */
  export function reconstructOpen(
    bundle: Parameters<IAutoMovieRecoveryOpenReconstructionOperation.Operation>[0],
    graph: Parameters<IAutoMovieRecoveryOpenReconstructionOperation.Operation>[1],
  ): ReturnType<IAutoMovieRecoveryOpenReconstructionOperation.Operation> {
    return reconstructOpenImplementation(bundle, graph);
  }

  /** Admit continuation data and prepare ordinary open-run ownership. */
  export function prepareOpenRuns(
    bundle: Parameters<IAutoMovieRecoveryOpenRunsPreparationOperation.Operation>[0],
    graph: Parameters<IAutoMovieRecoveryOpenRunsPreparationOperation.Operation>[1],
    operator: Parameters<IAutoMovieRecoveryOpenRunsPreparationOperation.Operation>[2],
  ): ReturnType<IAutoMovieRecoveryOpenRunsPreparationOperation.Operation> {
    return prepareOpenRunsImplementation(bundle, graph, operator);
  }
  /** Normalize and optionally reverse one saved open course for open-run reconstruction. */
  export function normalizeCourse(
    curve: IAutoMovieCubicBezierCurve64,
    reverse: boolean,
  ): IAutoMovieCubicBezierCurve64 {
    return normalizeRecoveryCourseImplementation(curve, reverse);
  }
}