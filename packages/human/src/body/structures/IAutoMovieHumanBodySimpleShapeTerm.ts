import type { IAutoMovieHumanBodySimpleShapeCurve } from "./IAutoMovieHumanBodySimpleShapeCurve";

/**
 * One simple-tier term row: a channel, a gain and the curves whose product
 * scales it. Rows naming the same channel add. The mass direction's rows
 * have the same form, their products being the direction's coefficients.
 *
 * @evidence contracts/common.md#principled-implementation A gain times the product of parameter curves contributes to a named channel; contributions to the same channel add.
 * @evidence contracts/common.md#clear-and-simple-design One row represents one additive contribution and also describes a mass-direction coefficient.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The channel binding refers to supplied basis geometry rather than a precomputed person's output.
 * @evidence contracts/common.md#meaningful-documentation The comment gives both additive and multiplicative semantics and the mass-direction reuse.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The additive term rows definition supplies no executable processing strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The additive term rows type neither schedules requests nor caches results.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The additive term rows declaration does not acquire or retain runtime resources.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySimpleShapeTerm {
  /** The body channel the row writes. */
  channel: string;

  /** The row's scale. */
  gain: number;

  /** The curves whose product the gain scales. */
  curves: IAutoMovieHumanBodySimpleShapeCurve[];
}
