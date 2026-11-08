/**
 * Admission and moving-boundary population facts returned by the wearable resolver.
 * These counts do not measure elapsed time, allocated bytes or solver iterations.
 *
 * @evidence contracts/development/design.md#principled-representation An admitted subject ordinal and production ceiling separate selection from per-step anchor/capsule counts; boundaryRecords counts the complete seek's resolved boundary rows.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One scalar report accompanies cloth state so callers can inspect the explicit live-selection slot and the boundary population consumed by the solve.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Counts describe declared/resolved populations rather than claiming a CPU-time, GPU-byte or integration-work measurement they do not perform.
 * @evidence contracts/development/common.md#meaningful-documentation Defines each count and distinguishes admission/boundary facts from performance timing and particle-solver cost.
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
