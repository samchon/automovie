/*
 * Fixed tolerances and distances shared by built observations.
 */
export const enum ObservationGeometry {
  /*
   * Numeric slack interpreted in each caller's units, including metres, doubled
   * square metres, and dimensionless determinant and normal comparisons.
   */
  Epsilon = 1e-6,

  /*
   * Standing eye height in metres, capped at half the space's height.
   */
  EyeHeightMeters = 1.6,

  /*
   * Boundary probe step and minimum centre-station aim distance, in metres.
   */
  ProbeMeters = 1e-3,
}
