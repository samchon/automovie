import type { IAutoMovieHumanEndpointScale } from "../../common/structures/IAutoMovieHumanEndpointScale";

/**
 * How far one unit of a connected-basis channel actually moves the surface.
 *
 * A basis channel is a dimensionless authored weight, so the same numeric edit means a different amount of geometry on every control: in the recorded source-head example one unit of `philtrumVolume` displaces tens of micrometres while one unit of `globalAgeStructure` displaces centimetres. An editor that shows only the envelope therefore shows a range without an anatomical quantity, and a consumer that compares, regularizes or budgets raw weights across channels conflates different displacement fields. The metre results below measure their effects, not a biological trait or a normal population interval.
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
 * @evidence contracts/common.md#principled-implementation Per-unit metre RMS over all resident vertices and maximum single-vertex displacement quantify source endpoint effects; articulated channels use the same attachment posing as the builder.
 * @evidence contracts/common.md#clear-and-simple-design Channel identity/kind and independent signed endpoint metrics serve editor presentation without mixing dimensionless weights with anatomical quantities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither metric certifies a physiological range, landmark outcome or contact-valid combination; the recorded source-head example is not a newly measured current asset.
 * @evidence contracts/common.md#meaningful-documentation The comment defines denominator, metre units, peak versus RMS and the effect-versus-anatomy distinction; members name positive/absent-negative ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This result interface executes no sparse-row accumulation or articulated posing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Channel effect records supply outputs, not a basis-analysis cache or repeated-computation strategy.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned scalar metrics belong to the editor caller; this type acquires no posed arrays or source handle.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceChannelScale {
  /** Channel identity, matching the basis channel this measures. */
  id: string;

  /** Copied from the channel so a caller can group without a second lookup. */
  kind: "shape" | "expression";

  /** Metric effect of the positive endpoint, always present. */
  positive: IAutoMovieHumanEndpointScale;

  /** Metric effect of the negative endpoint, or null for a nonnegative control. */
  negative: IAutoMovieHumanEndpointScale | null;
}
