import { autoMovieCaptionReadabilityRuntime } from "./autoMovieCaptionReadabilityRuntime";

/**
 * Exact grapheme implementation this package can evaluate.
 *
 * The identity is derived from the same segmenter that performs measurement.
 * The production still chooses whether to adopt it and owns every threshold;
 * a different complete identity remains unsupported without fallback.
 */
export const AUTOMOVIE_CAPTION_GRAPHEME_SEGMENTATION =
  autoMovieCaptionReadabilityRuntime.identity;
