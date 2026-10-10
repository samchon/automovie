import type { IAutoMovieQuadraticRefinementNativeCall } from "./IAutoMovieQuadraticRefinementNativeCall";
import type { IAutoMovieQuadraticPolishingResult } from "./IAutoMovieQuadraticPolishingResult";

/**
 * Original-variable QP candidate with independently measured original KKT data.
 * A failed polishing candidate retains the preceding original primal and dual,
 * the unchanged native status and separate attempt diagnostics. Only
 * the caller's original residual threshold and Solved status decide admission.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Returns caller-coordinate variables and signed original-row duals without publishing numerical slack variables as geometry.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Preserves original rows, endpoint authority and raw native failures beside full original-coordinate KKT measurements.
 * @author Samchon
 */
export interface IAutoMovieQuadraticRefinementResult {
  /** Owned leading variables of the original problem, excluding numerical slacks. */
  primal: number[];

  /** Signed multipliers in original row order, including fixed and dependent rows. */
  dual: number[];

  /** Original native status; polishing never promotes an unsuccessful solve. */
  status: number;

  /** Largest original interval violation, in the caller's row units. */
  maximumViolation: number;

  /** Infinity norm of original H*x+q+A'*y. */
  stationarityResidual: number;

  /** Largest signed original multiplier times its endpoint gap. */
  complementarityResidual: number;

  /** Actual original-coordinate correction iterations after the native solve. */
  refinements: number;

  /** Initial original primal, retained as historical context rather than a later correction frame. */
  reference: number[];

  /** Complete original input row population, retained in admission. */
  originalRows: number;

  /** Exact coefficient-group metadata count; original admission keeps all rows. */
  presolvedRows: number;

  /** Original row ordinals of every exact interval group. */
  rowGroups: number[][];

  /** The actual initial native solve; polishing adds no native call. */
  nativeCalls: IAutoMovieQuadraticRefinementNativeCall[];

  /** Original-coordinate polishing attempt; acceptance is independent of native status. */
  polishing?: IAutoMovieQuadraticPolishingResult;
}
