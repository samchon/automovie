/**
 * A calibrated world-to-camera transform in the seed's arbitrary length gauge.
 *
 * @evidence contracts/common.md#principled-implementation Proper R and t represent Xcamera=R*Xworld+t in the first-camera coordinate system; only the seed baseline is unit length.
 * @evidence contracts/common.md#clear-and-simple-design One named numerical record serves resection, joint fitting and sparse-map publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No metric scale, expected pose or covariance is supplied by this record.
 * @evidence contracts/common.md#meaningful-documentation Members specify row order, axes, transform direction and translation units.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased record performs no numerical work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This record defines no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns ordinary arrays; no resource is acquired.
 */
export interface IAutoMovieRecoveryMapPose {
  /** Nine row-major proper-rotation coefficients; camera axes are +X right, +Y down and +Z forward. */
  rotation: number[];

  /** Three camera-frame translation coefficients in arbitrary seed-baseline units; a resected camera is not normalized independently. */
  translation: [number, number, number];
}
