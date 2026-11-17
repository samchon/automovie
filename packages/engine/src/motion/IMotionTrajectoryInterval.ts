/**
 * One fixed Hermite interval's exact stored endpoint data.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member identifies its knot time, state vector or endpoint derivative.
 * @evidence contracts/development/design.md#principled-representation Adjacent stored states and right-hand-side derivatives define the actual cubic vector interpolant.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The physical departure certificate needs actual dense coefficients without reconstructing them through rounded interpolation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts All arrays are fresh copies; callers cannot change retained integration knots through this record.
 */
export interface IMotionTrajectoryInterval {
  /** First knot time, seconds. */
  from: number;
  /** Next knot time, seconds. */
  to: number;
  /** State at the first knot. */
  start: readonly number[];
  /** State at the next knot. */
  end: readonly number[];
  /** State derivative at the first knot. */
  first: readonly number[];
  /** State derivative at the next knot. */
  last: readonly number[];
}
