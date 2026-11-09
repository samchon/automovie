import {
  IAutoMovieBlockingCoverage,
  IAutoMovieCamera,
} from "@automovie/interface";

/**
 * One blocking coverage intent that passed the coverage gate, with the staged
 * camera it plays from.
 *
 * `gatePerformShotCamera` records one per intent whose camera is staged, is
 * not the live camera, is not already covered by an earlier intent, and whose
 * framing, move and subject are usable; `performShot` compiles each into one
 * alternate take on `shot.coverage`, in blocking order.
 *
 * @evidence contracts/development/design.md#principled-representation Pairs the intent with the resolved staged camera, because the take compiles from that camera's own staged bearing and the gate has already proven the lookup succeeds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two fields, the intent and its camera, which is all the framing-camera gate and the coverage compile read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Recorded only after every coverage rule passed, so the compile never meets a duplicate, hero or unstaged camera.
 * @evidence contracts/development/common.md#meaningful-documentation States when one is recorded, who consumes it and in what order, and what each field holds.
 */
export interface IPerformShotCoverageJob {
  /** The blocking's coverage intent. */
  intent: IAutoMovieBlockingCoverage;

  /** The staged camera the intent names. */
  camera: IAutoMovieCamera;
}
