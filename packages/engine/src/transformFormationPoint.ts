import { IAutoMovieFormationMotionState, IAutoMovieVector3 } from "@automovie/interface";
/**
 * Apply one sampled formation state to a designed world-space point.
 *
 * @evidence contracts/common.md#principled-implementation The XZ offset is rotated into base-facing coordinates, scaled laterally and in depth, then rotated by base plus cue facing and translated; Y receives translation only, under admitted finite and representable scalar arithmetic.
 * @evidence contracts/common.md#clear-and-simple-design One point transform defines the affine spacing/facing rule used by formation bounds, production placement and validation callers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The authored base frame is preserved rather than scaling world axes; no vertical spacing scale, admission clamp or malformed-state fallback is introduced.
 * @evidence contracts/common.md#meaningful-documentation Documents world point/anchor coordinates, degree angles, dimensionless lateral/depth scales and fresh output; extreme finite products may still be unrepresentable.
 * @evidence contracts/performance.md#efficient-algorithms Each point takes constant trigonometric/scalar work and one fresh vector; bounds callers pay this cost for each of eight corners.
 * @evidence contracts/performance.md#reuse-equivalent-work Consumers share this canonical transform, but per-call angles are recomputed and no pose result is retained across mutable motion inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the fresh vector; input point, anchor and state are not retained and no host resources are acquired.
 * @author Samchon
 */
export const transformFormationPoint: (point: IAutoMovieVector3, anchor: IAutoMovieVector3, motion: IAutoMovieFormationMotionState, baseFacingDeg?: number) => IAutoMovieVector3 = (
  point: IAutoMovieVector3,
  anchor: IAutoMovieVector3,
  motion: IAutoMovieFormationMotionState,
  baseFacingDeg: number = 0,
): IAutoMovieVector3 => {
  const baseRadians: number = (baseFacingDeg * Math.PI) / 180;
  const baseCosine: number = Math.cos(baseRadians);
  const baseSine: number = Math.sin(baseRadians);
  const deltaX: number = point.x - anchor.x;
  const deltaZ: number = point.z - anchor.z;
  const localX: number =
    (deltaX * baseCosine - deltaZ * baseSine) * motion.spacingScale.lateral;
  const localZ: number =
    (deltaX * baseSine + deltaZ * baseCosine) * motion.spacingScale.depth;
  const radians: number = ((baseFacingDeg + motion.facingOffsetDeg) * Math.PI) / 180;
  const cosine: number = Math.cos(radians);
  const sine: number = Math.sin(radians);
  return {
    x: anchor.x + motion.translation.x + localX * cosine + localZ * sine,
    y: point.y + motion.translation.y,
    z: anchor.z + motion.translation.z - localX * sine + localZ * cosine,
  };
};
