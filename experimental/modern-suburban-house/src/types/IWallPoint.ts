/**
 * Caller-authored wall outline vertex: running coordinate u and world height y, in metres. Partition junctions, door notches and sloped exterior wall heads carry these coordinates on their existing wall body; enclosed rectangular void bounds remain in IWallHole.
 *
 * @author Samchon
 */
export interface IWallPoint {
  /** Position on the wall's world X or Z running axis, including authored corners and notch stations. */
  u: number;

  /** World height carrying the caller's displayed bottom, storey datum, door head or sloped top. */
  y: number;
}
