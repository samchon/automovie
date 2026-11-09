import { IAutoMovieCaptionReadabilityMeasurement } from "./IAutoMovieCaptionReadabilityMeasurement";
import { IAutoMovieCaptionReadabilityOutcome } from "./IAutoMovieCaptionReadabilityOutcome";

/**
 * Readability report kept outside the byte-stable compiled edit.
 *
 * @evidence contracts/development/design.md#principled-representation Render emits version-two reports by mapping the supplied caption track in its existing order, pairing each measurement with the selected profile verdict or explicit not-run outcome; canonical ordering is a caller premise rather than a sorting operation here.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One ordered cue list pairs measurement and outcome without modifying the byte-stable edit; runtime-dependent readability therefore remains independent of deterministic edit serialization.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A report does not replace absent evaluations with successful cues or drop their measured facts, and runtime segmentation changes cannot silently mutate the compiled edit identity.
 * @evidence contracts/development/common.md#meaningful-documentation States the report's separation from the compiled edit, schema version, canonical cue ordering and measurement-versus-profile-outcome pairing.
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
