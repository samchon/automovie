import { IAutoMovieHumanFaceEndpointScale } from "./IAutoMovieHumanFaceEndpointScale";

/**
 * How far one unit of a connected-basis channel actually moves the surface.
 *
 * A basis channel is a dimensionless authored weight, so the same numeric edit
 * means a different amount of geometry on every control: on the shipped CC0
 * head one unit of `philtrumVolume` displaces tens of micrometres while one
 * unit of `globalAgeStructure` displaces centimetres. An editor that shows only
 * the envelope therefore shows a range without an anatomical quantity, and a
 * consumer that compares, regularizes or budgets raw weights across channels
 * conflates different displacement fields. The metre results below measure
 * their effects, not a biological trait or a normal population interval.
 *
 * Both figures are reported per unit of weight, in metres, over all surfaces of
 * the basis at once, because every attached surface consumes the same control
 * state. `displacement` is the root mean square over every resident vertex,
 * including the ones the endpoint leaves alone, so a channel that moves a wide
 * area scores above one that moves the same distance on a few vertices; it is
 * the whole endpoint's geometric commitment. `peak` is the largest single
 * vertex displacement. Neither metric identifies which anatomical landmark
 * moved or establishes that a combination of endpoints preserves attachment.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceChannelScale {
  /** Channel identity, matching the basis channel this measures. */
  id: string;

  /** Copied from the channel so a caller can group without a second lookup. */
  kind: "shape" | "expression";

  /** Metric effect of the positive endpoint, always present. */
  positive: IAutoMovieHumanFaceEndpointScale;

  /** Metric effect of the negative endpoint, or null for a nonnegative control. */
  negative: IAutoMovieHumanFaceEndpointScale | null;
}
