/**
 * Complete execution identity of one caption grapheme segmenter.
 *
 * Locale-sensitive runtimes retain both the requested locale and the locale they actually resolved. An implementation may claim locale neutrality only when locale is not an input to its segmentation behavior.
 *
 * @evidence contracts/common.md#principled-implementation Algorithm, data revision, grapheme granularity and actual locale participation identify the measurement law; readability evaluation compares the complete selected identity with the runtime that performed segmentation before issuing a verdict.
 * @evidence contracts/common.md#clear-and-simple-design Requested-resolved locale and locale-neutral are separate arms, preventing a locale-sensitive segmenter from omitting either part of its actual execution context.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Locale neutrality cannot hide a runtime locale input, and a different installed segmenter does not silently satisfy a profile naming another revision or resolved locale.
 * @evidence contracts/common.md#meaningful-documentation States complete execution identity, versioned segmentation behavior, requested and resolved locale ownership, and the condition under which locale neutrality can be claimed.
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
