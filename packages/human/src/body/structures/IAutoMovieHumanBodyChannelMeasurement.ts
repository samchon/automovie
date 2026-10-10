import type { AutoMovieHumanBodySide } from "../anatomy/identity/AutoMovieHumanBodySide";
import type { IAutoMovieHumanBodyMeasurement } from "./IAutoMovieHumanBodyMeasurement";

/**
 * A channel's bound measurement rule read at the neutral and at each
 * endpoint's full weight, in metres.
 *
 * A rule the surface cannot answer (no section loop, a landmark the basis
 * lacks, an empty skin region) reports null values rather than a number.
 *
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
