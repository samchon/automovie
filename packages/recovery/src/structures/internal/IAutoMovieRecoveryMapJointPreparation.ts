import type { IAutoMovieRecoveryMapElimination } from "./IAutoMovieRecoveryMapElimination";

/**
 * Current original point qualification and consistently scaled elimination.
 *
 * @evidence contracts/development/design.md#principled-representation Original point SVDs qualify the borrowed blocks before the same point-first orthogonal elimination supplies undamped or augmented camera rows.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Step solving and metric-only construction share this preparation without inventing an unused step or gradient.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A null unrequested gradient is not zero stationarity; damping never replaces original rank.
 * @evidence contracts/development/common.md#meaningful-documentation Fields define global physical column scales, point qualification and the call-local elimination action.
 */
export interface IAutoMovieRecoveryMapJointPreparation {
  /** Number of admitted gauge-fixed camera coordinates. */
  cameraWidth: number;

  /** Positive original global camera-column norms. */
  cameraScales: number[];

  /** Positive three-column norms for each original point block. */
  pointScales: number[][];

  /** Minimum independently qualified undamped point singular ratio. */
  minimumPointDesignRatio: number;

  /** Scaled original gradient maximum when requested; null means uncomputed. */
  gradient: number | null;

  /**
   * Eliminate the admitted blocks with zero or the caller's valid damping.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Givens rotations eliminate point coordinates from the same globally scaled original rows, optionally augmented by sqrt(damping) point/camera identity rows.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call-local action supplies independent original-rank rows and the separate damped operation without a second scale definition.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No normal matrix, floor, dropped residual or damping-derived data rank replaces orthogonal elimination.
   * @evidence contracts/development/common.md#meaningful-documentation The amount must be finite nonnegative and caller admitted; current consumers pass zero or their already admitted coefficient. Returned rows/right/triangles are owned; numerical failures propagate.
   * @evidence contracts/development/implementation.md#efficient-algorithms Point elimination costs O((E+L)*C), materializing O(E*C+L*C) values under the preparation's original entry admission.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Borrowed current blocks and prepared scales serve both zero and positive amounts; changed-state designs require fresh preparation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The closure borrows blocks and scales until the consuming operation returns; each owned elimination expires or transfers its triangles to one current metric.
   */
  eliminate: (amount: number) => IAutoMovieRecoveryMapElimination;
}
