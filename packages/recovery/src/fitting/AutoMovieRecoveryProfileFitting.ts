import type {
  IAutoMovieRecoveryImageProfilesFittingOperation,
  IAutoMovieRecoveryScalarIntervalsSelectionOperation,
  IAutoMovieRecoveryScalarProfilesFittingOperation,
} from "@automovie/interface";

import { fitRecoveryImageProfiles as fitImageProfilesImplementation } from "./internal/fitRecoveryImageProfiles";
import { fitRecoveryScalarProfiles as fitScalarProfilesImplementation } from "./internal/fitRecoveryScalarProfiles";
import { selectRecoveryScalarIntervals as selectScalarIntervalsImplementation } from "./internal/selectRecoveryScalarIntervals";

/** Fits physical scalar fields and selects saved physical intervals. */
export namespace AutoMovieRecoveryProfileFitting {
  /**
   * Fits aligned-ellipse centres and radii in a common cubic spline space.
   *
   * The millimetre samples contain the two radii followed by the two centres.
   * Their first and last stations bound the common chart. The span count is a
   * positive safe integer and the minimum QR diagonal ratio lies in (0, 1). The
   * returned controls use metres. Invalid input, unsupported fit rank or
   * nonpositive fitted radius controls throw.
   */
  export function fitImageProfiles(
    samples: Parameters<IAutoMovieRecoveryImageProfilesFittingOperation.Operation>[0],
    spans: Parameters<IAutoMovieRecoveryImageProfilesFittingOperation.Operation>[1],
    minimumRankRatio: Parameters<IAutoMovieRecoveryImageProfilesFittingOperation.Operation>[2],
  ): ReturnType<IAutoMovieRecoveryImageProfilesFittingOperation.Operation> {
    return fitImageProfilesImplementation(samples, spans, minimumRankRatio);
  }

  /**
   * Fits co-charted scalar profiles in a clamped uniform cubic spline space.
   *
   * Each row supplies a finite station and the same number of finite scalar
   * observations, in millimetres. The first and last stations define the
   * increasing fitting interval. Supply at least three more rows than the
   * positive safe-integer span count. The minimum QR diagonal ratio lies in (0,
   * 1). A deficient design or unresolved fit throws. Returned intervals and
   * Bernstein controls use metres.
   */
  export function fitScalarProfiles(
    samples: Parameters<IAutoMovieRecoveryScalarProfilesFittingOperation.Operation>[0],
    spans: Parameters<IAutoMovieRecoveryScalarProfilesFittingOperation.Operation>[1],
    minimumRankRatio: Parameters<IAutoMovieRecoveryScalarProfilesFittingOperation.Operation>[2],
  ): ReturnType<IAutoMovieRecoveryScalarProfilesFittingOperation.Operation> {
    return fitScalarProfilesImplementation(samples, spans, minimumRankRatio);
  }

  /**
   * Selects complete saved slabs by positive overlap with a physical window.
   *
   * Supply at least two finite increasing levels in millimetres and a full
   * permutation of the integer slab indices. Omitting the window selects all
   * slabs in that order. A supplied increasing finite window retains indices
   * whose slab intersects it with positive length. Whole-slab bounds can extend
   * past the window. Invalid levels, ordering or window throw.
   */
  export function selectScalarIntervals(
    levelsMm: Parameters<IAutoMovieRecoveryScalarIntervalsSelectionOperation.Operation>[0],
    order: Parameters<IAutoMovieRecoveryScalarIntervalsSelectionOperation.Operation>[1],
    windowMm?: Parameters<IAutoMovieRecoveryScalarIntervalsSelectionOperation.Operation>[2],
  ): ReturnType<IAutoMovieRecoveryScalarIntervalsSelectionOperation.Operation> {
    return selectScalarIntervalsImplementation(levelsMm, order, windowMm);
  }
}
