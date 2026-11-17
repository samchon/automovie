import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/** Data and callback contracts shared by the SolidRibbon operations. */
export namespace IAutoMovieSolidRibbon {
  /**
   * Paired boundary ribbons of one blend column, oriented in increasing cross share.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Start is cross share zero and end is one; both derivatives use that dimensionless clock and world millimetres.
   * @evidence contracts/development/design.md#principled-representation Two complete boundary jets define one quintic Hermite column without changing rail phase or physical station units.
   * @evidence contracts/development/design.md#minimal-and-owned-surface SplitBand, SolidJoin and BlendChain.strip exchange this pair; join-specific rail and outward direction remain on the join record.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The pair does not certify positive span, monotonicity or unfolding; the builder owns numerical checks.
   */
  export interface IColumn {
    /** Start boundary at cross share zero, with derivatives toward increasing share. */
    start: IRibbon;

    /** End boundary at cross share one, with the same derivative orientation. */
    end: IRibbon;
  }
  /**
   * Point and two derivatives across a blend column in world millimetres.
   *
   * @evidence contracts/development/design.md#principled-representation These vectors describe a boundary restriction S(r+w*a*d) or an interior evaluation of the same Hermite column, differentiated in its dimensionless cross share.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Point, first and second derivative fields expose the transverse jet without storing another surface evaluator.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The type does not certify transversality, smooth variation along the rail or G2 continuity of a whole blended surface.
   * @evidence contracts/development/common.md#meaningful-documentation Gives mm point units and derivative orders relative to the blend cross parameter.
   */
  export interface IRibbon {
    /** Boundary or interior column point in world millimetres. */
    point: AutoMovieVector3Tuple;

    /** First cross derivative in millimetres per unit dimensionless blend share. */
    first: AutoMovieVector3Tuple;

    /** Second cross derivative in millimetres per squared blend share. */
    second: AutoMovieVector3Tuple;
  }
}
