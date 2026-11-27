import type {
  IAutoMovieRecoveryImageProfilesFittingOperation,
  IAutoMovieRecoveryScalarIntervalsSelectionOperation,
  IAutoMovieRecoveryScalarProfilesFittingOperation,
} from "@automovie/interface";

import { fitRecoveryImageProfiles as fitImageProfilesImplementation } from "./internal/fitRecoveryImageProfiles";
import { fitRecoveryScalarProfiles as fitScalarProfilesImplementation } from "./internal/fitRecoveryScalarProfiles";
import { selectRecoveryScalarIntervals as selectScalarIntervalsImplementation } from "./internal/selectRecoveryScalarIntervals";

/** Fit Recovery profiles and select complete saved scalar intervals. */
export namespace AutoMovieRecoveryProfileFitting {
  /** Fit the aligned ellipse's four scalar fields in one shared cubic spline space. */
  export function fitImageProfiles(
    samples: Parameters<IAutoMovieRecoveryImageProfilesFittingOperation.Operation>[0],
    spans: Parameters<IAutoMovieRecoveryImageProfilesFittingOperation.Operation>[1],
    minimumRankRatio: Parameters<IAutoMovieRecoveryImageProfilesFittingOperation.Operation>[2],
  ): ReturnType<IAutoMovieRecoveryImageProfilesFittingOperation.Operation> {
    return fitImageProfilesImplementation(samples, spans, minimumRankRatio);
  }

  /** Fit co-charted scalar profiles in one clamped uniform cubic B-spline space. */
  export function fitScalarProfiles(
    samples: Parameters<IAutoMovieRecoveryScalarProfilesFittingOperation.Operation>[0],
    spans: Parameters<IAutoMovieRecoveryScalarProfilesFittingOperation.Operation>[1],
    minimumRankRatio: Parameters<IAutoMovieRecoveryScalarProfilesFittingOperation.Operation>[2],
  ): ReturnType<IAutoMovieRecoveryScalarProfilesFittingOperation.Operation> {
    return fitScalarProfilesImplementation(samples, spans, minimumRankRatio);
  }

  /** Select complete saved scalar slabs that overlap the requested physical window. */
  export function selectScalarIntervals(
    levelsMm: Parameters<IAutoMovieRecoveryScalarIntervalsSelectionOperation.Operation>[0],
    order: Parameters<IAutoMovieRecoveryScalarIntervalsSelectionOperation.Operation>[1],
    windowMm?: Parameters<IAutoMovieRecoveryScalarIntervalsSelectionOperation.Operation>[2],
  ): ReturnType<IAutoMovieRecoveryScalarIntervalsSelectionOperation.Operation> {
    return selectScalarIntervalsImplementation(levelsMm, order, windowMm);
  }
}