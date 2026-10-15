
/**
 * Cut plane `x * px + y * py + z * pz + constant = 0` for a roof tile; the side where the
 * expression is positive is kept.
 */
export interface TileCutPlane {
  /** Plane normal's x component. */
  x: number;
  /** Plane normal's y component. */
  y: number;
  /** Plane normal's z component. */
  z: number;
  /** Plane offset. */
  constant: number;
}
