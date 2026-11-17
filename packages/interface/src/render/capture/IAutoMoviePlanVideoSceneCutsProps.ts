/**
 * A video path, report path and scene-change threshold for an FFmpeg scdet plan. planAutoMovieVideoSceneCuts admits finite thresholds in [0, 100] and escapes the report as a filter-graph value. The host owns process execution and output files.
 *
 * @evidence contracts/development/design.md#principled-representation The host owns process execution and output files.
 * @evidence contracts/development/design.md#minimal-and-owned-surface planAutoMovieVideoSceneCuts exchanges file, report, threshold; their canonical owner is this contract and their concrete meanings are documented on the members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The host owns process execution and output files.
 * @evidence contracts/development/common.md#meaningful-documentation A video path, report path and scene-change threshold for an FFmpeg scdet plan. planAutoMovieVideoSceneCuts admits finite thresholds in [0, 100] and escapes the report as a filter-graph value. The prose and members document how planAutoMovieVideoSceneCuts interprets and admits these values.
 */
export interface IAutoMoviePlanVideoSceneCutsProps {
  /** Path of the video file. */
  file: string;

  /** Path the report is written to. */
  report: string;

  /** Score from 0 to 100 at which a frame starts a new scene. */
  threshold: number;
}
