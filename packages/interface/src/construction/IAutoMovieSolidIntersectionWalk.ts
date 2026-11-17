import type { AutoMovieSolidChartVector4 } from "./AutoMovieSolidChartVector4";
import type { IAutoMovieSolidTraceLaw } from "./IAutoMovieSolidTraceLaw";

/**
 * Data and callback contracts shared by the SolidIntersectionWalk operations.
 *
 * @evidence contracts/development/design.md#principled-representation IWalk binds a reference tracing law to the original four chart preimages and host face at radian trace parameter zero.
 * @evidence contracts/development/design.md#minimal-and-owned-surface SolidIntersectionWalk produces the seed law consumed by SolidIntersectionTrace; the law and chart tuple retain their existing owners.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A walk record does not certify closure or regularity of the later intersection trace.
 * @evidence contracts/development/common.md#meaningful-documentation Defines initial preimage order, host-face identity and reference-law ownership.
 */
export namespace IAutoMovieSolidIntersectionWalk {
  /**
   * A walked reference law and the original starting preimages.
   *
   * @evidence contracts/development/design.md#principled-representation The seed tuple is [part station, part phase, host first coordinate, host second coordinate] at trace parameter zero; each surface owns its chart units.
   * @evidence contracts/development/design.md#minimal-and-owned-surface SolidIntersectionWalk returns the original seed and law together for SolidIntersectionTrace.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The tuple fixes four coordinates but neither valid face indices nor a closed intersection; tracing performs those checks.
   * @evidence contracts/development/common.md#meaningful-documentation Names the original starting preimages and retained parameter law.
   */
  export interface IWalk {
    /** The original reference-guide law used for requested arc parameterization. */
    law: IAutoMovieSolidTraceLaw.ILaw;

    /** `[s, phi, y, theta]` at `t = 0`. */
    x: AutoMovieSolidChartVector4;

    /** The host face at `t = 0`. */
    face: number;
  }
}
