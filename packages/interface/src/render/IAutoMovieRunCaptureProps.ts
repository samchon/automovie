import type { IAutoMovieCaptureCell } from "./IAutoMovieCaptureCell";
import type { IAutoMovieCaptureDrawing } from "./IAutoMovieCaptureDrawing";
import type { IAutoMovieCaptureFolder } from "./IAutoMovieCaptureFolder";
import type { IAutoMovieCapturePlan } from "./IAutoMovieCapturePlan";
import type { IAutoMovieCaptureVideoSource } from "./IAutoMovieCaptureVideoSource";

/**
 * An admitted capture plan and effectful host ports. runCapture checks
 * the folder round identities, awaits one draw per cell, records draw/raster
 * failures as failed rows, and publishes the complete record after
 * still/sheet/comparison writes. Storage and publication failures reject the
 * run; optional video/section values become null in the record when absent.
 */
export interface IAutoMovieRunCaptureProps {
  /** The capture, planned by `planCapture`. */
  plan: IAutoMovieCapturePlan;

  /**
   * Draw one planned cell at the subject's exact raster. The returned picture
   * must be writable because capture stamps labels into its pixels; the host
   * owns drawing-resource cleanup. The capture host implements drawing;
   * runCapture awaits cells sequentially and records a rejected draw
   * or wrong raster as a failed cell.
   */
  draw: (cell: IAutoMovieCaptureCell) => Promise<IAutoMovieCaptureDrawing>;

  /** The capture's folder, opened for the plan's round and compared round. */
  folder: IAutoMovieCaptureFolder;

  /** Source revision the host draws from, such as a commit hash. */
  revision: string;

  /**
   * How a comparison pairs cells: `cell` for two captures of a drawn subject,
   * `time` for an encoded file against its source.
   */
  match: "cell" | "time";

  /**
   * The video file the stills come from, with its detected cuts, recorded as it
   * is; absent for a drawn subject.
   */
  video?: IAutoMovieCaptureVideoSource;

  /**
   * The subject owner's own section of the record, such as a motion case's
   * verdicts and metrics, written as it is; absent when the owner has none.
   */
  section?: Readonly<Record<string, unknown>>;
}
