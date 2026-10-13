/**
 * A closed `[min, max]` interval of allowed rotation about one anatomical axis, in degrees.
 *
 * This is the atom of automovie's anatomical range-of-motion (ROM) model. The engine holds, per joint and per axis, one of these intervals (sourced from clinical goniometry norms) and rejects any pose whose joint angle falls outside it, feeding the violation back into the harness as a `// ❌` correction. That is how automovie makes "physically impossible poses are structurally rejected" real, rather than hoping the LLM emits plausible numbers.
 *
 * Sign convention is per-axis and documented on {@link IAutoMovieJointConstraint}. `min <= max` is required; the engine treats `min > max` as a malformed constraint.
 *
 * @evidence contracts/common.md#principled-implementation Finite ordered degree endpoints form an inclusive interval against which admitted pose angles are compared on the owning clinical axis.
 * @evidence contracts/common.md#clear-and-simple-design Two scalars compose with each joint axis without importing default ROM tables into the pure type package.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Inverted ranges are malformed and cannot be swapped or clamped silently; declared rig constraints remain distinct from inferred physical possibility.
 * @evidence contracts/common.md#meaningful-documentation Defines degree units, inclusive endpoints, per-axis sign ownership and min-at-most-max admission.
 * @author Samchon
 */
export interface IAutoMovieAngleRange {
  /** Lower bound, degrees (inclusive). */
  min: number;

  /** Upper bound, degrees (inclusive). */
  max: number;
}
