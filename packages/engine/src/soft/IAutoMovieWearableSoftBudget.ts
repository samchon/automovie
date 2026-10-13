
/**
 * Admission and moving-boundary population facts returned by the wearable resolver.
 * These counts do not measure elapsed time, allocated bytes or solver iterations.
 *
 * @evidence contracts/common.md#principled-implementation An admitted subject ordinal and production ceiling separate selection from per-step anchor/capsule counts; boundaryRecords counts the complete seek's resolved boundary rows.
 * @evidence contracts/common.md#clear-and-simple-design One scalar report accompanies cloth state so callers can inspect the explicit live-selection slot and the boundary population consumed by the solve.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Counts describe declared/resolved populations rather than claiming a CPU-time, GPU-byte or integration-work measurement they do not perform.
 * @evidence contracts/common.md#meaningful-documentation Defines each count and distinguishes admission/boundary facts from performance timing and particle-solver cost.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This report computes nothing itself; selection and boundary resolution own the checks that fill these fields.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Budget scalars describe one seek and hold no request scheduling or cross-subject cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Five primitive numbers retain no domain, frame array or simulation allocation after their producing call.
 * @author Samchon
 */
export interface IAutoMovieWearableSoftBudget {
  /** Zero-based admitted subject slot. */
  subjectIndex: number;

  /** Declared maximum simultaneous wearable subjects. */
  maxSubjects: number;

  /** Moving anchor count per step. */
  anchorsPerStep: number;

  /** Moving body-capsule count per step. */
  capsulesPerStep: number;

  /** Total moving boundary records consumed for the seek. */
  boundaryRecords: number;
}
