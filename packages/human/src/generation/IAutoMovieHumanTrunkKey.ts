/**
 * The trunk column's measures at one landmark station: a key the column's
 * splines run through (`AutoMovieHumanTrunkColumn`).
 *
 * Lengths are calibration millimetres in the body frame. A key is a station
 * where a tape is taken or a landmark stands, so every channel below is
 * published at its site and the column only runs between them.
 */
export interface IAutoMovieHumanTrunkKey {
  /** Height, mm. */
  y: number;

  /** Half width at the widest point. */
  width: number;

  /** Forward place of the widest point. */
  middle: number;

  /**
   * Front midline's forward place; null where the abdominal wall's front runs
   * through its neighbours, because the key's tape fixes a girth there and
   * not where the wall stands (the high hip).
   */
  front: number | null;

  /**
   * Back midline's forward place; null where the base's back runs through
   * its neighbours, because a relief (the buttock) stands there.
   */
  back: number | null;

  /** Squareness of the front quadrant. */
  squareFront: number;

  /** Squareness of the back quadrant. */
  squareBack: number;

  /** Lateral share of the half width where the anterior axillary guide stands. */
  anterior: number;
}
