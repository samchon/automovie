import type { IAutoMovieActionCall } from "../harness/IAutoMovieActionCall";
import type { IAutoMovieAttachJob } from "./IAutoMovieAttachJob";
import type { IAutoMoviePerformShotFrameJob } from "./IAutoMoviePerformShotFrameJob";
import type { IAutoMoviePerformShotLaunchJob } from "./IAutoMoviePerformShotLaunchJob";

/**
 * What the per-action input gate of `performShot` sorted the action list into.
 *
 * `gatePerformShotActions` builds it in one pass over the performing actions:
 * `frame` actions elect the live camera and become frame jobs, every other
 * action joins the stage list, and `launch` and `attachTo` actions that passed
 * their own checks also become jobs. Later stages append to `stageActions` and
 * `stageActionPaths` together when a launch schedules a recoil, and sort
 * `frames` in place.
 */
export interface IAutoMovieEnginePerformShotActionPlan {
  /**
   * The camera the first valid `frame` action named, or null when no frame
   * action elected one; the camera gate then falls back to the scene's first.
   */
  liveCamera: string | null;

  /** Every non-`frame` action in input order, then each injected recoil. */
  stageActions: IAutoMovieActionCall[];

  /**
   * The violation path of each `stageActions` entry, index for index: the
   * action's `region` field, or the `onHit` of the launch that injected it.
   */
  stageActionPaths: string[];

  /** Every `frame` action whose subject resolved. */
  frames: IAutoMoviePerformShotFrameJob[];

  /** Every `launch` with a staged projectile and a resolved aim. */
  launches: IAutoMoviePerformShotLaunchJob[];

  /** Every `attachTo` whose parent is a rigged staged node carrying the bone. */
  attachments: IAutoMovieAttachJob[];
}
