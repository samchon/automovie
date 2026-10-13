import { IAutoMovieCaptionReadabilityMeasurement } from "./IAutoMovieCaptionReadabilityMeasurement";
import { IAutoMovieCaptionReadabilityOutcome } from "./IAutoMovieCaptionReadabilityOutcome";

/**
 * Readability report kept outside the byte-stable compiled edit.
 *
 * @author Samchon
 */
export interface IAutoMovieCaptionReadabilityReport {
  /** Caption-readability report schema. */
  version: 2;

  /** Cue reports in canonical film and cue order. */
  cues: Array<{
    /** Effective cue measurements. */
    measurement: IAutoMovieCaptionReadabilityMeasurement;

    /** Profile-backed verdict or explicit measure-only outcome. */
    outcome: IAutoMovieCaptionReadabilityOutcome;
  }>;
}
