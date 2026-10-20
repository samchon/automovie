import type { IAutoMovieRecoveryOpenContinuationInterval } from "./IAutoMovieRecoveryOpenContinuationInterval";

/**
 * Source-free open-curve incidence accompanying one original saved section publication.
 *
 * @evidence contracts/common.md#principled-implementation Adjacent section ordinals, open-curve ordinals and endpoint reversal retain observed transport without copying controls.
 * @evidence contracts/common.md#clear-and-simple-design Coefficient authority remains in the section publication while incidence and orientation observations travel separately.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source mesh, normal array, positional weld or inferred closure is supplied.
 * @evidence contracts/common.md#meaningful-documentation Fields distinguish section and curve ordinals, retained orientation and physical sampling policy.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural record performs no observation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The declaration owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the records and arrays.
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
