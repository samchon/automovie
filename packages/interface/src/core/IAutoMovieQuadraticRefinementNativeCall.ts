/**
 * The native solve a refinement started from, as
 * `refineAutoMovieQuadraticProgram` records it.
 *
 * The values are the kernel's own report, copied, in the caller's unscaled
 * units; polishing never calls the kernel again. The kernel's residuals are its
 * internal normalized measures, separate from the refinement's own full-row
 * measurement. When the solve did not succeed its primal and dual are kept here
 * for diagnosis only and must not be used as geometry.
 */
export interface IAutoMovieQuadraticRefinementNativeCall {
  /** Native status: 1 is Solved; any other value is unsuccessful. */
  status: number;

  /** Interior-point iterations the solve reported. */
  iterations: number;

  /** The solver's normalized primal residual. */
  primalResidual: number;

  /** The solver's normalized dual residual. */
  dualResidual: number;

  /** Primal objective the solver reported. */
  objective: number;

  /** Dual objective the solver reported. */
  dualObjective: number;

  /** `|objective − dualObjective|`; a duality gap, not rowwise complementarity. */
  gap: number;

  /** Number of rows in the program the solve received. */
  rows: number;

  /** Copy of the solve's primal, present only when `status` is not 1. */
  primal?: number[];

  /** Copy of the solve's dual, present only when `status` is not 1. */
  dual?: number[];
}
