/**
 * Plan point in world metres on the XZ plane. Plan polygons are finite counter-clockwise convex lists
 * of these, and heights over them are planes `y = ax + bz + c`; only numeric error is absorbed, at 1e-9.
 */
export interface PlanPoint {
  /** World x in metres. */
  x: number;
  /** World z in metres. */
  z: number;
}
