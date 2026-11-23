/** A calibrated world-to-camera transform in the seed's arbitrary length gauge. */
export interface IAutoMovieRecoveryMapPose {
  /**
   * Nine row-major proper-rotation coefficients; camera axes are +X right, +Y
   * down and +Z forward.
   */
  rotation: number[];

  /**
   * Three camera-frame translation coefficients in arbitrary seed-baseline
   * units; a resected camera is not normalized independently.
   */
  translation: [number, number, number];
}
