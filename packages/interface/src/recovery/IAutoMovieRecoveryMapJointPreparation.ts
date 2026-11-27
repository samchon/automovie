import type { IAutoMovieRecoveryMapElimination } from "..";

/** Current original point qualification and consistently scaled elimination. */
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

  /** Eliminate the admitted blocks with zero or the caller's valid damping. */
  eliminate: (amount: number) => IAutoMovieRecoveryMapElimination;
}
