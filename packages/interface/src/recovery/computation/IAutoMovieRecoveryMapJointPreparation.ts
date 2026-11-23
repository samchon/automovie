import type { IAutoMovieRecoveryMapElimination } from "../../index";

/** Current original point qualification and consistently scaled elimination.
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

  /** Eliminate the admitted blocks with zero or the caller's valid damping.
   */
  eliminate: (amount: number) => IAutoMovieRecoveryMapElimination;
}
