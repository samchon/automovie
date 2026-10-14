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
 * @evidence contracts/common.md#principled-implementation Pairs the intent with the resolved staged camera, because the take compiles from that camera's own staged bearing and the gate has already proven the lookup succeeds.
 * @evidence contracts/common.md#clear-and-simple-design Two fields, the intent and its camera, which is all the framing-camera gate and the coverage compile read.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Recorded only after every coverage rule passed, so the compile never meets a duplicate, hero or unstaged camera.
 * @evidence contracts/common.md#meaningful-documentation States when one is recorded, who consumes it and in what order, and what each field holds.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Type-only: the coverage gate writes at most one per intent, and the camera compile that reads it owns the work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Built once per intent and read by the framing-camera gate and the coverage compile of the same call.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Lives for one `performShot` call and references the caller's intent and the staged camera.
 * @author Samchon
 */
export interface IPerformShotCoverageJob {
  /** The blocking's coverage intent. */
  intent: IAutoMovieBlockingCoverage;

  /** The staged camera the intent names. */
  camera: IAutoMovieCamera;
}
