import { IAutoMovieCaptionGraphemeSegmentationIdentity } from "./IAutoMovieCaptionGraphemeSegmentationIdentity";

/**
 * Profile-backed verdict or explicit measure-only outcome for one caption cue.
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
