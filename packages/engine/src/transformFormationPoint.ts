import {
  IAutoMovieFormationMotionState,
  IAutoMovieVector3,
} from "@automovie/interface";

/** Apply one sampled formation state to a designed world-space point. */
export const transformFormationPoint: (
  point: IAutoMovieVector3,
  anchor: IAutoMovieVector3,
  motion: IAutoMovieFormationMotionState,
  baseFacingDeg?: number,
) => IAutoMovieVector3 = (
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
  const radians: number =
    ((baseFacingDeg + motion.facingOffsetDeg) * Math.PI) / 180;
  const cosine: number = Math.cos(radians);
  const sine: number = Math.sin(radians);
  return {
    x: anchor.x + motion.translation.x + localX * cosine + localZ * sine,
    y: point.y + motion.translation.y,
    z: anchor.z + motion.translation.z - localX * sine + localZ * cosine,
  };
};
