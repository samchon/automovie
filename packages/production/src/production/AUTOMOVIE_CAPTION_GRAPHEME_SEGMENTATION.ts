import { autoMovieCaptionReadabilityRuntime } from "./autoMovieCaptionReadabilityRuntime";

/**
 * Exact grapheme implementation this package can evaluate.
 *
 * The identity is derived from the same segmenter that performs measurement.
 * The production still chooses whether to adopt it and owns every threshold;
 * a different complete identity remains unsupported without fallback.
 *
 * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-caption-readability-profile Declares the complete grapheme segmentation identity, including the Unicode and ICU revision and the requested and resolved locale, that every measurement reports and that a profile must equal exactly before a verdict exists.
 * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-readability-profile Fixes the actual complete segmentation identity the readability contract compares a requested profile identity against, so an unsupported identity stays measure-only instead of falling back to this segmenter.
 */
export const AUTOMOVIE_CAPTION_GRAPHEME_SEGMENTATION =
  autoMovieCaptionReadabilityRuntime.identity;
