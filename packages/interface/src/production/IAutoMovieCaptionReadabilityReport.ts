import { IAutoMovieCaptionReadabilityMeasurement } from "./IAutoMovieCaptionReadabilityMeasurement";
import { IAutoMovieCaptionReadabilityOutcome } from "./IAutoMovieCaptionReadabilityOutcome";

/**
 * Readability report kept outside the byte-stable compiled edit.
 *
 * @evidence contracts/common.md#principled-implementation Version-two reports pair each canonical timeline cue's measured counts with the verdict earned by its actual segmentation identity and selected profile, retaining explicit not-run outcomes where evaluation is unsupported.
 * @evidence contracts/common.md#clear-and-simple-design One ordered cue list pairs measurement and outcome without modifying the byte-stable edit; runtime-dependent readability therefore remains independent of deterministic edit serialization.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A report does not replace absent evaluations with successful cues or drop their measured facts, and runtime segmentation changes cannot silently mutate the compiled edit identity.
 * @evidence contracts/common.md#meaningful-documentation States the report's separation from the compiled edit, schema version, canonical cue ordering and measurement-versus-profile-outcome pairing.
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
