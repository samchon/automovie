import { IAutoMovieCaptionGraphemeSegmentationIdentity } from "./IAutoMovieCaptionGraphemeSegmentationIdentity";

/**
 * Profile-backed verdict or explicit measure-only outcome for one caption cue.
 *
 * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-caption-readability-profile Keeps missing profile separate from a passing verdict.
 * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-readability-measurement Evaluates only an exact requested-to-actual identity match and otherwise records `not-run`.
 */
export type IAutoMovieCaptionReadabilityOutcome =
  | {
      /** Profile-backed evaluation completed. */
      status: "evaluated";
      /** Exact production profile id. */
      profile: string;
      /** Complete segmentation identity selected by the production profile. */
      segmentation: IAutoMovieCaptionGraphemeSegmentationIdentity;
      /** Whether every profile-declared boundary passed. */
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
