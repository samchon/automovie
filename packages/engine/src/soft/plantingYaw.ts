import { IAutoMovieQuaternion } from "@automovie/interface";

/**
 * Map a seeded sample to a rational-circle +Y turn, then normalized quaternion
 * interpolation toward identity by the admitted jitter fraction.
 */
export function plantingYaw(
  sample: number,
  amount: number,
): IAutoMovieQuaternion {
  const doubled: number = 2 * sample;
  const half: number = Math.floor(doubled);
  const t: number = doubled - half;
  const denominator: number = 1 + t * t;
  const cosine: number = (1 - t * t) / denominator;
  const sine: number = (2 * t) / denominator;
  // `half === 1` lifts the first quadrant into the second by the quarter-turn
  // rotation `(c, s) -> (-s, c)`, so `φ` sweeps the whole half-turn that a full
  // turn of the branch corresponds to.
  const w: number = half === 0 ? cosine : -sine;
  const y: number = half === 0 ? sine : cosine;
  const blended: { x: number; y: number; z: number; w: number } = {
    x: 0,
    y: amount * (w < 0 ? -y : y),
    z: 0,
    w: 1 - amount + amount * (w < 0 ? -w : w),
  };
  const length: number = Math.sqrt(
    blended.y * blended.y + blended.w * blended.w,
  );
  return { x: 0, y: blended.y / length, z: 0, w: blended.w / length };
}
