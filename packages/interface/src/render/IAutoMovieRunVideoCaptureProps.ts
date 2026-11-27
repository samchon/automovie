import type { IAutoMovieCapturePlanRequest } from "./IAutoMovieCapturePlanRequest";
import type { IAutoMovieCaptureStorage } from "./IAutoMovieCaptureStorage";
import type { IAutoMovieCaptureSubject } from "./IAutoMovieCaptureSubject";

/**
 * A probed video's clock/raster, capture request and host storage/process
 * operations. runVideoCapture refuses unsupported
 * views/passes/inspection and off-grid instants before extraction, detects cuts
 * then extracts selected frames, and records missing frames as failed cells.
 * The host must reject run when FFmpeg fails and owns process cleanup.
 */
export interface IAutoMovieRunVideoCaptureProps {
  /** Path of the video file, as the process runner reads it. */
  file: string;

  /**
   * The file's clock and raster, which the host knows from its source or a
   * probe.
   */
  subject: Pick<
    IAutoMovieCaptureSubject,
    "name" | "durationSeconds" | "fps" | "width" | "height"
  >;

  /** What the capture asks for. */
  request: IAutoMovieCapturePlanRequest;

  /** Where files are read and written. */
  storage: IAutoMovieCaptureStorage;

  /** The capture's root folder. */
  root: string;

  /**
   * Runs FFmpeg with the given arguments and resolves when it ends
   * successfully. The host implements FFmpeg process execution;
   * runVideoCapture awaits each planned command, and the host must
   * reject failure and release process resources.
   */
  run: (args: readonly string[]) => Promise<void>;

  /** Source revision the host captures from. */
  revision: string;
}
