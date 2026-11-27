/*
 * Compute combined orthogonal-axis swing as 2 * acos(cos(flexion/2) *
 * cos(abduction/2)), with degree inputs/output. Finite representable arithmetic
 * returns the closed range [0, 360]; multi-turn inputs are periodic and are not
 * universally monotonic from zero.
 */
export function swingConeAngle(flexion: number, abduction: number): number {
  return (
    (Math.acos(
      Math.cos((flexion * Math.PI) / 360) *
        Math.cos((abduction * Math.PI) / 360),
    ) *
      360) /
    Math.PI
  );
}
