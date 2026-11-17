import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/** Data and callback contracts shared by the SolidBlend operations. */
export namespace IAutoMovieSolidBlend {
  /**
     * A column's point and its first and second derivatives in dimensionless `w`.
     *
     * @evidence contracts/development/design.md#principled-representation Three world vectors carry a Hermite column's value and parameter derivatives, independently of its rail's own parameter speed.
     * @evidence contracts/development/design.md#minimal-and-owned-surface One named field per derivative order exposes the same column to direct blend readers and Join's fold checks.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts This record does not certify regularity, G2 contact or the absence of self-intersection.
     * @evidence contracts/development/common.md#meaningful-documentation Identifies world millimetres and derivatives per unit w, with no physical-span rescaling.
     */
    export interface IJet {
      /** Point, mm. */
      point: AutoMovieVector3Tuple;
  
      /** First derivative, mm per unit `w`. */
      first: AutoMovieVector3Tuple;
  
      /** Second derivative, mm per unit `w` squared. */
      second: AutoMovieVector3Tuple;
    }
}
