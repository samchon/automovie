import type { IAutoMovieCaptionReadabilityMeasurement } from "./IAutoMovieCaptionReadabilityMeasurement";
import type { IAutoMovieCaptionReadabilityOutcome } from "./IAutoMovieCaptionReadabilityOutcome";

/** Readability report kept outside the byte-stable compiled edit. */
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
