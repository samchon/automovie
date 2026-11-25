import type { IViewerCameraStateSnapshot } from "./IViewerCameraStateSnapshot.js";

/**
 * A mounted frame's transfer state, captured and restored by its frame
 * controller: the native camera and the scene time it was drawn at.
 */
export interface IViewerFrameTransfer {
  /** Native camera state of the completed view. */
  camera: IViewerCameraStateSnapshot;

  /** Scene seconds of the completed view, finite and nonnegative. */
  elapsedSeconds: number;
}
