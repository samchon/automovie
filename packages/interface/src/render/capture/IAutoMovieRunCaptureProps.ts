import type { IAutoMovieCaptureCell } from "./IAutoMovieCaptureCell.js";
import type { IAutoMovieCaptureDrawing } from "./IAutoMovieCaptureDrawing.js";
import type { IAutoMovieCaptureFolder } from "./IAutoMovieCaptureFolder.js";
import type { IAutoMovieCapturePlan } from "./IAutoMovieCapturePlan.js";
import type { IAutoMovieCaptureVideoSource } from "./IAutoMovieCaptureVideoSource";

/**
 * An admitted capture plan and effectful host ports. runAutoMovieCapture checks the folder round identities, awaits one draw per cell, records draw/raster failures as failed rows, and publishes the complete record after still/sheet/comparison writes. Storage and publication failures reject the run; optional video/section values become null in the record when absent.
 *
 * @evidence contracts/development/design.md#principled-representation Storage and publication failures reject the run; optional video/section values become null in the record when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface runAutoMovieCapture exchanges plan, draw, folder, revision, match, video, section; their canonical owner is this contract and their concrete meanings are documented on the members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Storage and publication failures reject the run; optional video/section values become null in the record when absent.
 * @evidence contracts/development/common.md#meaningful-documentation An admitted capture plan and effectful host ports. runAutoMovieCapture checks the folder round identities, awaits one draw per cell, records draw/raster failures as failed rows, and publishes the complete record after still/sheet/comparison writes. The prose and members document how runAutoMovieCapture interprets and admits these values.
 */
export interface IAutoMovieRunCaptureProps {
  /** The capture, planned by `planAutoMovieCapture`. */
  plan: IAutoMovieCapturePlan;

  /**
   * Draw one planned cell at the subject's exact raster. The returned picture must be writable because capture stamps labels into its pixels; the host owns drawing-resource cleanup.
   * The capture host implements drawing; runAutoMovieCapture awaits cells sequentially and records a rejected draw or wrong raster as a failed cell.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States plan-order invocation, required subject raster, mutable returned pixels and host-owned drawing resources.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation The signature specifies the callback result and failure contract; the caller-supplied body owns the method and its premises.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This callable member is an injected boundary with no implementation decomposition; the named caller and consumer own their respective bodies.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No executable branch or compensation is implemented by this signature; the supplied body must honor the documented result and failure semantics.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no traversal or allocation strategy; callback cost belongs to the supplied implementation and is not bounded by the type.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration coordinates no calls or cache; the consuming operation owns invocation frequency and the supplied body owns any effect-safe reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no handle or task; the callback owner must manage captured state and resources for the documented invocation lifetime.
   */
  draw: (cell: IAutoMovieCaptureCell) => Promise<IAutoMovieCaptureDrawing>;

  /** The capture's folder, opened for the plan's round and compared round. */
  folder: IAutoMovieCaptureFolder;

  /** Source revision the host draws from, such as a commit hash. */
  revision: string;

  /** How a comparison pairs cells: `cell` for two captures of a drawn subject, `time` for an encoded file against its source. */
  match: "cell" | "time";

  /** The video file the stills come from, with its detected cuts, recorded as it is; absent for a drawn subject. */
  video?: IAutoMovieCaptureVideoSource;

  /** The subject owner's own section of the record, such as a motion case's verdicts and metrics, written as it is; absent when the owner has none. */
  section?: Readonly<Record<string, unknown>>;
}
