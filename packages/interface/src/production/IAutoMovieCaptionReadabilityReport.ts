import { IAutoMovieCaptionReadabilityMeasurement } from "./IAutoMovieCaptionReadabilityMeasurement";
import { IAutoMovieCaptionReadabilityOutcome } from "./IAutoMovieCaptionReadabilityOutcome";

/**
 * Readability report kept outside the byte-stable compiled edit.
 *
 * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-caption-readability-profile Reports metrics without modifying legacy caption output when no profile exists.
 * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-readability-measurement Joins each actual identity and measurement to its evaluated or not-run outcome.
 * @author Samchon
 */
export interface IAutoMovieCaptionReadabilityReport {
  /**
   * Caption-readability report schema.
   *
   * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-caption-readability-profile Versions the measurement and outcome record.
   * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-readability-profile Makes report interpretation explicit.
   */
  version: 2;

  /**
   * Cue reports in canonical film and cue order.
   *
   * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-caption-readability-profile Reports every measured cue in deterministic order.
   * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-readability-profile Joins measurements and outcomes without modifying the edit.
   */
  cues: Array<{
    /** Effective cue measurements. */
    measurement: IAutoMovieCaptionReadabilityMeasurement;

    /** Profile-backed verdict or explicit measure-only outcome. */
    outcome: IAutoMovieCaptionReadabilityOutcome;
  }>;
}
