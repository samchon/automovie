/**
 * World-to-camera rigid transform in the map's first-camera gauge. Apply `R ×
 * point + t`; camera X points right, Y down and Z forward.
 */
export interface IAutoMovieRecoveryMapPose {
  /** Nine row-major coefficients of the proper world-to-camera rotation. */
  rotation: number[];

  /**
   * Additive camera-frame translation in seed-baseline units. Only the seed
   * second-camera translation fixes the unit length.
   */
  translation: [number, number, number];
}
