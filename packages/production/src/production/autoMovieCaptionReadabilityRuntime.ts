import type { IAutoMovieCaptionGraphemeSegmentationIdentity } from "@automovie/interface";

const requestedLocale = "en";
const segmenter = new Intl.Segmenter(requestedLocale, {
  granularity: "grapheme",
});
const options = segmenter.resolvedOptions();

/**
 * Node's resident grapheme implementation and its complete measurement identity.
 *
 * The public identity and caption inspector share this single segmenter. Its
 * Unicode/ICU revision and resolved locale describe the actual host runtime;
 * the production still owns its language profiles and thresholds. Segmenting
 * another language does not substitute another implementation or locale.
 * Identity records are frozen, while each segmentation creates its own iterable
 * over the supplied text. This module reads no project state or mutable profile.
 */
export const autoMovieCaptionReadabilityRuntime = Object.freeze({
  identity: Object.freeze({
    algorithm: "intl-segmenter-grapheme",
    version: `unicode-${process.versions.unicode}/icu-${process.versions.icu}`,
    granularity: options.granularity as "grapheme",
    locale: Object.freeze({
      kind: "requested-resolved" as const,
      requested: requestedLocale,
      resolved: options.locale,
    }),
  }) satisfies IAutoMovieCaptionGraphemeSegmentationIdentity,
  segment: (value: string): Iterable<unknown> => segmenter.segment(value),
});
