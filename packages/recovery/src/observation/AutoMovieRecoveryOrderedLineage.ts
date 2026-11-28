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
   * Reobserve requested saved sections in their original registered millimetre
   * frame. Pass byte-verified artifact identities and source selection. The
   * operation compares declared identities and exact raw contour provenance.
   * Supply one unique nonnegative safe-integer native face ordinal per input
   * triangle. Keep input arrays immutable for the synchronous call. Invalid
   * maps, mismatched frames or mismatched contour populations throw.
   */
  export function observeCuts(
    input: IAutoMovieRecoveryOrderedLineage.Input,
  ): IAutoMovieRecoveryOrderedCuts {
    return observeRecoveryOrderedCuts(input);
  }

  /**
   * Recover pointwise correspondence for selected saved cubics. Supply
   * verified cut and target identities and the original fit policy. A target
   * qualifies only if replay reproduces the saved numeric coefficients and
   * widths. Local failures retain their milestones, and source or frame
   * conflicts throw before fitting.
   */
  export function bindSavedFits(
    input: IAutoMovieRecoveryOrderedLineage.Input,
    cuts: IAutoMovieRecoveryOrderedCuts,
    targets: readonly IAutoMovieRecoveryOrderedLineage.Target[],
  ): IAutoMovieRecoverySavedCurveBinding[] {
    return bindRecoveryOrderedFits(input, cuts, targets);
  }
}
