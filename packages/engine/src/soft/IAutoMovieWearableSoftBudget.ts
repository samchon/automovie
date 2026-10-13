/** Exact admission facts for one live deterministic wearable solve. */
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
