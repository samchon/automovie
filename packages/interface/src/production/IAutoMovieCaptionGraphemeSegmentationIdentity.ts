/**
 * Complete execution identity of one caption grapheme segmenter.
 *
 * Locale-sensitive runtimes retain both the requested locale and the locale
 * they actually resolved. An implementation may claim locale neutrality only
 * when locale is not an input to its segmentation behavior.
 *
 * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-caption-readability-profile Makes the actual grapheme execution basis observable beside every measurement.
 * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-readability-profile Defines the complete identity a profile must select before it can produce a verdict.
 * @author Samchon
 */
export interface IAutoMovieCaptionGraphemeSegmentationIdentity {
  /** Non-blank algorithm identity supported by the selected validator. */
  algorithm: string;
  /** Exact algorithm or segmentation-data revision. */
  version: string;
  /** Grapheme-cluster granularity used to measure caption text. */
  granularity: "grapheme";
  /** Locale participation in the actual segmentation execution. */
  locale:
    | {
        /** The runtime resolves a requested locale before segmenting. */
        kind: "requested-resolved";
        /** Non-blank locale passed to the runtime. */
        requested: string;
        /** Non-blank locale reported by the runtime after resolution. */
        resolved: string;
      }
    | {
        /** The algorithm does not consume or resolve locale state. */
        kind: "locale-neutral";
      };
}
