import { IAutoMovieCaptionGraphemeSegmentationIdentity } from "./IAutoMovieCaptionGraphemeSegmentationIdentity";

/**
 * Profile-backed verdict or explicit measure-only outcome for one caption cue. Missing profiles and segmentation mismatches retain measurements without a verdict.
 *
 * @evidence contracts/common.md#principled-implementation Evaluated outcomes bind exact profile and segmentation identity to five named boundary results; missing profiles or unsupported selected segmentation yield distinct not-run reasons instead of inferred acceptance.
 * @evidence contracts/common.md#clear-and-simple-design The status union keeps passed and breaches exclusively on evaluated results, while not-run carries only the requested identity and why no judgment occurred.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Measurements alone cannot become passing readability evidence, and a segmentation mismatch cannot fall back to the resident runtime under the requested profile's name.
 * @evidence contracts/common.md#meaningful-documentation States both non-evaluation cases, profile and segmentation ownership, applicable-boundary acceptance including the skipped null gap, and each breach category.
 * @author Samchon
 */
export type IAutoMovieCaptionReadabilityOutcome =
  | {
      /** Profile-backed evaluation completed. */
      status: "evaluated";

      /** Exact production profile id. */
      profile: string;

      /** Complete segmentation identity selected by the production profile. */
      segmentation: IAutoMovieCaptionGraphemeSegmentationIdentity;

      /** Whether every applicable boundary passed; a null preceding gap skips the minimum-gap check. */
      passed: boolean;

      /** Stable names of boundaries exceeded by this cue. */
      breaches: Array<
        | "graphemes-per-second"
        | "lines-per-cue"
        | "graphemes-per-line"
        | "duration-frames"
        | "gap-frames"
      >;
    }
  | {
      /** No production profile judged the measurement. */
      status: "not-run";

      /** Requested segmentation identity, or null when no profile was declared. */
      segmentation: IAutoMovieCaptionGraphemeSegmentationIdentity | null;

      /** Exact reason a verdict was not computed. */
      reason:
        | "caption-readability-profile-not-declared"
        | "caption-grapheme-segmentation-unsupported";
    };
