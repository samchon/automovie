import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/** Data and callback contracts shared by the SolidRibbon operations. */
export namespace IAutoMovieSolidRibbon {
  /**
     * Surface point and two across derivatives for a fixed chart direction/scale.
     *
     * @evidence contracts/development/design.md#principled-representation These three vectors are the endpoint data of the surface restriction S(r+w*a*d) used by a boundary-matching blend.
     * @evidence contracts/development/design.md#minimal-and-owned-surface Point, first and second derivative fields expose the transverse jet without storing another surface evaluator.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts The type does not certify transversality, smooth variation along the rail or G2 continuity of a whole blended surface.
     * @evidence contracts/development/common.md#meaningful-documentation Gives mm point units and derivative orders relative to the blend cross parameter.
     */
    export interface IRibbon {
      /** The rail's point, mm. */
      point: AutoMovieVector3Tuple;
  
      /** First derivative across the rail per unit of the blend's cross parameter. */
      first: AutoMovieVector3Tuple;
  
      /** Second derivative across the rail. */
      second: AutoMovieVector3Tuple;
    }
}
