import type {
  IAutoMovieCaptionReadabilityProfile,
  IAutoMovieCaptionReadabilityReport,
  IAutoMovieFilmTimeline,
} from "@automovie/interface";
import { inspectAutoMovieCaptionReadabilityWithRuntime } from "@automovie/render";

import { autoMovieCaptionReadabilityRuntime } from "./autoMovieCaptionReadabilityRuntime";

/**
 * Measure canonical caption cues with the resident Node grapheme runtime.
 *
 * Production inspection passes the exact timeline and production-owned language
 * profiles. The render inspector owns threshold evaluation; this adapter owns
 * only the runtime that earns a measurement. Missing profiles retain measured
 * facts with `not-run`. Unsupported segmentation is also `not-run`, and the
 * resident identity never substitutes for it to produce a verdict. Neither
 * timeline nor profile records are mutated or published by this adapter.
 *
 * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-caption-readability-profile Measures canonical cues through the installed grapheme runtime while applying only the production's exact supported profile identity.
 * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-readability-profile Supplies the same resident segmentation identity and implementation to the readability evaluator without locale fallback.
 */
export const inspectAutoMovieCaptionReadability = (
  timeline: IAutoMovieFilmTimeline,
  profiles: readonly IAutoMovieCaptionReadabilityProfile[],
): IAutoMovieCaptionReadabilityReport =>
  inspectAutoMovieCaptionReadabilityWithRuntime(
    timeline, profiles, autoMovieCaptionReadabilityRuntime,
  );
