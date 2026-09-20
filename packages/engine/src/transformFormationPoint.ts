import { IAutoMovieFormationMotionState, IAutoMovieVector3 } from "@automovie/interface";

/**
 * Apply a sampled formation state to one designed world-space point.
 *
 * @evidence requirements/formations/budgets-and-validation.md#formation-determinism Applies spacing in the unit frame, then facing and translation, so repeated motion samples produce the same member position.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-determinism-status-compatibility Provides the shared point transform used by oracle, builder, and renderer formation paths.
 */
export const transformFormationPoint = (
  point: IAutoMovieVector3,
  anchor: IAutoMovieVector3,
  motion: IAutoMovieFormationMotionState,
  baseFacingDeg = 0,
): IAutoMovieVector3 => {
  const baseRadians = (baseFacingDeg * Math.PI) / 180;
  const baseCosine = Math.cos(baseRadians);
  const baseSine = Math.sin(baseRadians);
  const deltaX = point.x - anchor.x;
  const deltaZ = point.z - anchor.z;
  const localX =
    (deltaX * baseCosine - deltaZ * baseSine) * motion.spacingScale.lateral;
  const localZ =
    (deltaX * baseSine + deltaZ * baseCosine) * motion.spacingScale.depth;
  const radians = ((baseFacingDeg + motion.facingOffsetDeg) * Math.PI) / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  return {
    x: anchor.x + motion.translation.x + localX * cosine + localZ * sine,
    y: point.y + motion.translation.y,
    z: anchor.z + motion.translation.z - localX * sine + localZ * cosine,
  };
};
