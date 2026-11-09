import { IAutoMovieActionCall } from "@automovie/interface";

import { IAttachJob } from "./IAttachJob";
import { IPerformShotFrameJob } from "./IPerformShotFrameJob";
import { IPerformShotLaunchJob } from "./IPerformShotLaunchJob";

/**
 * What the per-action input gate of `performShot` sorted the action list into.
 *
 * `gatePerformShotActions` builds it in one pass over the performing actions:
 * `frame` actions elect the live camera and become frame jobs, every other
 * action joins the stage list, and `launch` and `attachTo` actions that passed
 * their own checks also become jobs. Later stages append to `stageActions` and
 * `stageActionPaths` together when a launch schedules a recoil, and sort
 * `frames` in place.
 *
 * @evidence contracts/development/design.md#principled-representation Keeps the stage list and its violation paths as parallel arrays because the performance builder reports a masked clip by its position in the list it was handed, which is neither the input index nor stable once engine-injected recoils are appended.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One result of the action pass holding the four lists and the election later stages read, instead of six loose variables threaded through each stage.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Jobs are recorded only for actions whose checks passed, and the path list stores a full path per entry so an injected recoil can point at the author's `onHit` rather than a field it does not have.
 * @evidence contracts/development/common.md#meaningful-documentation States who builds it, how actions are sorted into it, which later stages mutate which fields, and for each field what it holds.
 */
export interface IPerformShotActionPlan {
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
  frames: IPerformShotFrameJob[];

  /** Every `launch` with a staged projectile and a resolved aim. */
  launches: IPerformShotLaunchJob[];

  /** Every `attachTo` whose parent is a rigged staged node carrying the bone. */
  attachments: IAttachJob[];
}
