import type { AutoMovieHumanBodySide } from "../anatomy/identity/AutoMovieHumanBodySide";
import type { IAutoMovieHumanBodyMeasurement } from "./IAutoMovieHumanBodyMeasurement";

/**
 * A channel's bound measurement rule read at the neutral and at each
 * endpoint's full weight, in metres.
 *
 * A rule the surface cannot answer (no section loop, a landmark the basis
 * lacks, an empty skin region) reports null values rather than a number.
 *
 * @evidence contracts/common.md#principled-implementation The three readings come from one rule, so the editor's millimetre scale and the inverse share an instrument.
 * @evidence contracts/common.md#clear-and-simple-design A named record replacing the inline measurement object of the channel scale.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unanswerable reading stays null instead of a substituted number.
 * @evidence contracts/common.md#meaningful-documentation States units and null cases.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It defines no part.
 * @evidence contracts/modeling.md#parameter-channels Reports what a channel's endpoints measure so it can be typed as millimetres.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions All readings are metres on the rest skin.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The editor displays it.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The rule owns its definition and source.
 * @evidenceExclude contracts/anatomy.md#permitted-range It admits no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It is a reading, not an authoring input.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyChannelMeasurement {
  /** Rule identity from `HUMAN_BODY_MEASUREMENTS`. */
  id: string;
  /** Side the rule is read on, when the channel is one-sided and bound by side. */
  side?: AutoMovieHumanBodySide;
  /** The rule's kind. */
  kind: IAutoMovieHumanBodyMeasurement["kind"];
  /** Reading at the neutral shape. */
  neutral: number | null;
  /** Reading at the positive endpoint's full weight. */
  positive: number | null;
  /** Reading at the negative endpoint's full weight, or null without one. */
  negative: number | null;
}
