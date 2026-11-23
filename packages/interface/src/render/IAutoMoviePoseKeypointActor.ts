import type { IAutoMoviePoseKeypoint } from "../cinematics/IAutoMoviePoseKeypoint.js";

/**
 * One performing actor's projected joints in one output frame of the
 * pose-keypoint sidecar.
 *
 * `planPoseKeypointSidecar` writes one record per performance whose motion,
 * skeleton and scene node resolve, in the shot's performance order. A
 * pose-conditioned generator reads `keypoints` as the actor's skeleton on
 * screen and `atmosphere`, when present, as how visible the actor is through
 * the scene's fog.
 */
export interface IAutoMoviePoseKeypointActor {
  /** Id of the performing actor's scene node. */
  node: string;

  /**
   * The actor's named joints projected to the frame, in `resolvePoseKeypoints`
   * order, with off-frame joints flagged rather than clamped.
   */
  keypoints: IAutoMoviePoseKeypoint[];

  /**
   * Fraction of the actor's own color that survives the scene's fog at the
   * camera depth of the actor's world root: 1 at the lens, falling toward 0
   * with distance, from `sceneFogTransmittance` over the scene's fog.
   *
   * Screen coordinates alone do not say whether the subject standing there is
   * fully visible or barely separable from the haze, so a pose-conditioned host
   * reads this to know. Present only when the scene declares fog.
   */
  atmosphere?: number;
}
