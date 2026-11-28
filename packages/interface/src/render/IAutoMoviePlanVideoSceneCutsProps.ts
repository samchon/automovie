/**
 * A video path, report path and scene-change threshold for an FFmpeg scdet
 * plan. planVideoSceneCuts admits finite thresholds in [0, 100] and
 * escapes the report as a filter-graph value. The host owns process execution
 * and output files.
 */
export interface IAutoMoviePlanVideoSceneCutsProps {
  /** Path of the video file. */
  file: string;

  /** Path the report is written to. */
  report: string;

  /** Score from 0 to 100 at which a frame starts a new scene. */
  threshold: number;

  /** Absolute input stream index. Omitted selects the first video stream. */
  streamIndex?: number;
}
