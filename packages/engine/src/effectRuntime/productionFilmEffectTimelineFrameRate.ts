import {
  IAutoMovieFilmTimeline,
  IAutoMovieProductionFrameRate,
} from "@automovie/interface";

import { resolveProductionFrameRate } from "../film/resolveProductionFrameRate";
import { AutoMovieFilmEffectRuntimeError } from "./AutoMovieFilmEffectRuntimeError";

/**
 * Resolve the timeline's exact rate for a film-effect question, or refuse it.
 *
 * The declared `frameRate` is reduced, or `fps` is read as `fps/1` when no
 * rational is declared. A display `fps` that disagrees with the declared
 * rational rate, a fractional `fps` without one, or a non-positive term is
 * refused as `film-effect-input-invalid`, so no projection or verification
 * runs against an ambiguous clock.
 *
 * @evidence contracts/common.md#principled-implementation Delegates to `resolveProductionFrameRate`, which reduces the rational and requires `fps` to equal `numerator / denominator` as the same float division every consumer performs, so one timeline cannot carry two clocks.
 * @evidence contracts/common.md#clear-and-simple-design Translates the shared resolver's plain `Error` into the film-effect refusal class, so the shot-time mapper, the interval projector and the population verifier refuse an ambiguous clock under one code without each repeating the try block.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The catch never falls back to `fps` or to the declared rational when the two disagree; every resolver failure becomes the one refusal.
 * @evidence contracts/common.md#meaningful-documentation States the two ways the rate is read, each refused case, the refusal code, and why ambiguity is refused before any projection.
 * @evidence contracts/performance.md#efficient-algorithms One greatest-common-divisor reduction, logarithmic in the smaller term, plus one division and comparison.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure resolution per call; each consumer resolves once at its start and reuses the value for all of its frames.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a new two-number record and keeps no reference to the timeline.
 */
export const productionFilmEffectTimelineFrameRate = (
  timeline: Pick<IAutoMovieFilmTimeline, "fps" | "frameRate">,
): IAutoMovieProductionFrameRate => {
  try {
    return resolveProductionFrameRate(timeline);
  } catch {
    throw new AutoMovieFilmEffectRuntimeError(
      "film-effect-input-invalid",
      "Film effect timeline frame rate must be a consistent positive exact rational identity.",
    );
  }
};
