/**
 * Named inspection direction: azimuth from +Z toward +X, elevation above the
 * world horizontal, and a positive multiplier on sphere-fit distance.
 */
export interface IAutoMovieRenderViewerViewpoint {
  /**
   * Deterministic identity of this viewpoint within its plan.
   *
   * Derived from the angles, so the same plan yields the same identities and a
   * coverage record can say which of them were actually rendered.
   */
  id: string;

  /**
   * Compass angle around the subject's world-up axis, in degrees, measured from
   * `+Z` toward `+X`.
   */
  azimuthDeg: number;

  /** Angle above the subject's horizontal plane, in degrees. */
  elevationDeg: number;

  /**
   * Multiplier on the floored circumsphere-fit distance; values above one add
   * distance. Finite input and clip conventions still govern whether the
   * complete subject is actually visible.
   */
  distanceFactor: number;
}
