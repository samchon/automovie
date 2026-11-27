import type {
  IAutoMovieRecoveryOrderedCuts,
  IAutoMovieRecoveryOrderedLineage,
  IAutoMovieRecoverySavedCurveBinding,
} from "@automovie/interface";

import { bindRecoveryOrderedFits } from "./internal/bindRecoveryOrderedFits";
import { observeRecoveryOrderedCuts } from "../geometry/internal/observeRecoveryOrderedCuts";

/**
 * Acquisition owner for ordered source cuts and equality-gated saved-cubic
 * correspondence. Source bytes and stage receipts remain the existing program's
 * responsibility. Both operations return acquisition metadata and never replace
 * generated or saved skin.
 */
export namespace AutoMovieRecoveryOrderedLineage {
  /**
   * Reobserve requested saved planes without reading or fitting a coefficient.
   * The caller verifies native and saved artifact bytes; this function compares
   * their declared source/selection/frame identities and rechecks complete raw
   * populations, closure and broad/exact face sets through the official binder.
   * Binary64 cutting is not certified exact arithmetic. No aggregate metadata
   * byte ceiling or cancellation hook is provided; the synchronous caller
   * bounds its selected mesh and saved-plane request and keeps borrowed inputs
   * immutable.
   */
  export function observeCuts(
    input: IAutoMovieRecoveryOrderedLineage.Input,
  ): IAutoMovieRecoveryOrderedCuts {
    return observeRecoveryOrderedCuts(input);
  }

  /**
   * Recover a new pointwise correspondence for explicitly requested saved
   * cubics. The caller byte-verifies cuts, target publications and their actual
   * policies. The original section fitter replays each target once; conversion
   * to the saved cubic basis must reproduce its JSON numeric geometry and
   * physical h exactly. A per-target failure retains completed milestones and
   * any obtained replay quality, but returns unavailable without samples or
   * replacement coefficients. Source/physical-frame admission failures throw
   * before targets. Historical accepted parameters, independent control effects
   * and surface transverse jets are not qualified. This synchronous call has no
   * cancellation hook or aggregate byte budget beyond the caller's finite
   * targets/fit budgets.
   */
  export function bindSavedFits(
    input: IAutoMovieRecoveryOrderedLineage.Input,
    cuts: IAutoMovieRecoveryOrderedCuts,
    targets: readonly IAutoMovieRecoveryOrderedLineage.Target[],
  ): IAutoMovieRecoverySavedCurveBinding[] {
    return bindRecoveryOrderedFits(input, cuts, targets);
  }
}
