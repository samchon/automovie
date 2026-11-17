import type { IAutoMovieSwivelSeed } from "./IAutoMovieSwivelSeed";

/**
 * A hinged chain's fit continued from a nearby one: the seed's branch, and
 * its swivel refined within one sweep step either way to `tolerance`, in
 * place of the sweep over every swivel (`hingedArmArticulation`).
 *
 * This is an explicit local-basin policy, not evidence that the current
 * target is nearby, its score is unimodal, or the cold global winner stays
 * within a degree. A deterministic curve owner must establish its phase
 * anchors and current endpoint/orientation/ROM/contact/branch checks, then
 * subdivide or fall back at unsupported events. The seed itself carries no
 * such certificate. Query arrival order must not choose a curve's anchors.
 *
 * @evidence contracts/development/design.md#principled-representation A seed and the width its swivel is refined to, the two facts a continued fit needs.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The seed's two members and one tolerance.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Extends `IAutoMovieSwivelSeed` rather than repeating it.
 * @evidence contracts/development/common.md#meaningful-documentation Defines the degree-valued local bracket and its positive finite width, distinguishes local continuation from cold global-score identity, and assigns deterministic phase/current-goal validation to the curve owner.
 */
export interface IAutoMovieSwivelNear extends IAutoMovieSwivelSeed {
  /**
   * The width of the swivel bracket the refinement stops at, degrees,
   * finite and positive. This sets the ideal contraction's target width;
   * binary64 probes can coincide before a smaller width is representable.
   * An arbitrary score has no global objective-error or global-minimum bound.
   */
  tolerance: number;
}
