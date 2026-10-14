/**
 * Compute combined orthogonal-axis swing as 2 * acos(cos(flexion/2) * cos(abduction/2)), with degree inputs/output. Finite representable arithmetic returns the closed range [0, 360]; multi-turn inputs are periodic and are not universally monotonic from zero.
 *
 * @evidence contracts/common.md#principled-implementation Evaluate 2*acos(cos(flexion/2)*cos(abduction/2)) in degrees for orthogonal rotations, retaining the quaternion representative's closed zero-to-360 angle.
 * @evidence contracts/common.md#clear-and-simple-design One closed-form metric is shared by cone validation, projection and admission rather than separate approximations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonfinite/huge-degree inputs can yield NaN; multi-turn inputs are periodic rather than universally monotonic distance from zero.
 * @evidence contracts/common.md#meaningful-documentation Docs state degree inputs/output, closed endpoint range and formula, correcting the previous exclusion of 360.
 * @evidence contracts/performance.md#efficient-algorithms Two cosines and one acos take constant arithmetic without collection allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work Clamps/validators reuse the metric but changed angles require new evaluation, with no retained angle table.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a scalar returns, retaining no angle history, native joint or task.
 */
export const swingConeAngle: (flexion: number, abduction: number) => number = (
  flexion: number,
  abduction: number,
): number =>
  (Math.acos(
    Math.cos((flexion * Math.PI) / 360) * Math.cos((abduction * Math.PI) / 360),
  ) *
    360) /
  Math.PI;
