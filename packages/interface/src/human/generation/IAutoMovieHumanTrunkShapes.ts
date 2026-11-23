/**
 * Dimensionless trunk section proportions and explicitly fitted shoulder
 * observations. Runtime construction and admission remain with
 * AutoMovieHumanTrunkShapes in Human.
 */
export namespace IAutoMovieHumanTrunkShapes {
  /** The shape at one station. */
  export interface IShape {
    /** Depth over breadth: front plus back depth over twice the half width. */
    depthRatio: number;

    /** The front depth's share of the whole depth. */
    frontShare: number;

    /** Forward place of the widest point, a share of stature. */
    middle: number;

    /** Squareness of the front quadrant. */
    squareFront: number;

    /** Squareness of the back quadrant. */
    squareBack: number;
  }

  /**
   * At the shoulder point: the front and back midlines' places and the widest
   * point's as shares of stature, and the squareness, read at 0.894 of the span
   * (m1 and m2; the women's loops there are open). Fitted, flagged.
   */
  export type IShoulder = {
    /** Front midline's forward place as a fraction of stature. */
    front: number;
    /**
     * Back midline's forward place as a fraction of stature; posterior
     * coordinates are negative.
     */
    back: number;
    /** Forward place of maximum breadth as a fraction of stature. */
    middle: number;
    /** Dimensionless front-quadrant superellipse exponent. */
    squareFront: number;
    /** Dimensionless posterior-quadrant superellipse exponent. */
    squareBack: number;
  };
}
