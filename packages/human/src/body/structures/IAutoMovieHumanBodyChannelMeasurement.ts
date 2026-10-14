import type { AutoMovieHumanBodySide } from "../anatomy/identity/AutoMovieHumanBodySide";
import type { IAutoMovieHumanBodyMeasurement } from "./IAutoMovieHumanBodyMeasurement";

/**
 * A channel's bound measurement rule read at the neutral and at each
 * endpoint's full weight, in metres.
 *
 * A rule the surface cannot answer (no section loop, a landmark the basis
 * lacks, an empty skin region) reports null values rather than a number.
 *
 * @evidence contracts/common.md#principled-implementation Nullable rule readings at neutral and signed full endpoints report actual metre-valued instrument results.
 * @evidence contracts/common.md#clear-and-simple-design Rule identity and optional side accompany the three readings for one channel binding.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing loops, landmarks or regions remain null instead of becoming a fabricated numerical measurement.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish rule kind, side binding, unavailable readings and absent negative endpoints.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The channel instrument readout is a type declaration without executable processing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The channel instrument readout coordinates no cross-call computation or caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The channel instrument readout type itself acquires no retained runtime resources.
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
