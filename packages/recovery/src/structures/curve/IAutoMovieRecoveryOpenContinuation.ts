import type { IAutoMovieRecoveryOpenContinuationInterval } from "./IAutoMovieRecoveryOpenContinuationInterval";

/**
 * Source-free open-curve incidence accompanying one original saved section publication.
 *
 * @evidence contracts/development/design.md#principled-representation Adjacent section ordinals, open-curve ordinals and endpoint reversal retain observed transport without copying controls.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Coefficient authority remains in the section publication while incidence and orientation observations travel separately.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No source mesh, normal array, positional weld or inferred closure is supplied.
 * @evidence contracts/development/common.md#meaningful-documentation Fields distinguish section and curve ordinals, retained orientation and physical sampling policy.
 */
export interface IAutoMovieRecoveryOpenContinuation {
  /** Strict boundary regularity classification used independently of saved station density. */
  criticalPolicy: "boundary-regular-path-v1";

  /** Adjacent saved-section pairs addressing reports[section].open. */
  intervals: IAutoMovieRecoveryOpenContinuationInterval[];

  /** Material tangent sign relative to each saved open curve, or null when unqualified. */
  orientations: (1 | -1 | null)[][];

  /** Nonblocking orientation warnings and unresolved observation messages. */
  diagnostics: string[];

  /** Requested physical sampling spacing, millimetres; not a surface or normal error bound. */
  resolutionMm: number;

  /** Explicit vertex budget per maximal open run. */
  maxVerticesPerRun: number;
}
