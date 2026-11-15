import { IAutoMovieSwivelSeed } from "./IAutoMovieSwivelSeed";

/**
 * A hinged chain's fit continued from a nearby one: the seed's branch, and
 * its swivel refined within one sweep step either way to `tolerance`, in
 * place of the sweep over every swivel (`hingedArmArticulation`).
 *
 * A fit's chosen swivel moves continuously with its target inside one basin
 * of its score, so a target a moment away from the seed's has its fit's
 * swivel within a step of the seed's, and the seeded fit is that fit. Where
 * the best basin changes between the two targets, the seeded fit stays on
 * the seed's basin: the continuous pose the seed's motion carries on to, which
 * a velocity read across the change wants, where the fit itself jumps.
 *
 * @evidence contracts/development/design.md#principled-representation A seed and the width its swivel is refined to, the two facts a continued fit needs.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The seed's two members and one tolerance.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Extends `IAutoMovieSwivelSeed` rather than repeating it.
 * @evidence contracts/development/common.md#meaningful-documentation States what a seeded fit searches, why it equals the fit inside a basin and what it gives where the basin changes.
 */
export interface IAutoMovieSwivelNear extends IAutoMovieSwivelSeed {
  /**
   * The width of the swivel bracket the refinement stops at, degrees,
   * positive; the swivel found lies within it of the bracket's best.
   */
  tolerance: number;
}
