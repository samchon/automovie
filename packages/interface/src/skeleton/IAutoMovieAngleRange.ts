/**
 * A closed `[min, max]` interval of allowed rotation about one anatomical axis, in degrees.
 *
 * The ROM validator compares a supplied joint angle with these declared inclusive bounds and reports an overshoot. Engine defaults draw on goniometry norms and rigs may override them; satisfying an interval alone is not proof of complete physical or anatomical possibility.
 *
 * Sign convention is per-axis and documented on {@link IAutoMovieJointConstraint}. `min <= max` is required; the engine treats `min > max` as a malformed constraint.
 *
 * @evidence contracts/development/design.md#principled-representation Finite ordered degree endpoints form an inclusive interval against which admitted pose angles are compared on the owning clinical axis.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two scalars compose with each joint axis without importing default ROM tables into the pure type package.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Inverted ranges are malformed and cannot be swapped or clamped silently; declared rig constraints remain distinct from inferred physical possibility.
 * @evidence contracts/development/common.md#meaningful-documentation Defines degree units, inclusive endpoints, per-axis sign ownership and min-at-most-max admission.
 */
export interface IAutoMovieAngleRange {
  /** Lower bound, degrees (inclusive). */
  min: number;

  /** Upper bound, degrees (inclusive). */
  max: number;
}
