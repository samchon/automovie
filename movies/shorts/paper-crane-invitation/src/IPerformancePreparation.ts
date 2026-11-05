/**
 * Actual controller preparation, with structural evaluation distinct from fit.
 * @evidence contracts/common.md#implementation-and-ownership Reports every complete controller frame and keeps structural exceptions distinct from native numerical failures. Actor-cache size alone never grants readiness. All arrays belong to this completed attempt.
 * @evidence contracts/common.md#authoring-interface Frames is retained actor-cache count. completeFrames contains successful full controller indices. failures includes every numerical or structural issue; structuralFailures is its exception subset. Render requires no failures; labelled numerical review requires complete frame coverage.
 */
export interface IPerformancePreparation {
  frames: number;
  completeFrames: number[];
  failures: { index: number; error: string }[];
  structuralFailures: { index: number; error: string }[];
}
