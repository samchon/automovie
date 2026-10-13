import type { IAutoMoviePoseKeypoint } from "@automovie/interface";

/**
 * One performing actor's projected joints in one output frame of the
 * pose-keypoint sidecar.
 *
 * `planPoseKeypointSidecar` writes one record per performance whose motion,
 * skeleton and scene node resolve, in the shot's performance order. A
 * pose-conditioned generator reads `keypoints` as the actor's skeleton on
 * screen and `atmosphere`, when present, as how visible the actor is through
 * the scene's fog.
 *
 * @evidence contracts/common.md#principled-implementation The record keeps the projected keypoints exactly as `resolvePoseKeypoints` returns them, joint order and off-frame flags included, and the transmittance is the engine's `sceneFogTransmittance` at the actor's camera depth, the law the viewer's fog shader applies, so the sidecar and the captured frame describe the same film.
 * @evidence contracts/common.md#clear-and-simple-design One record per actor holds the node id, the joints and the one optional atmosphere value, with no per-joint fog because a body's own depth range changes transmittance less than the difference a consumer can act on.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `atmosphere` is omitted rather than written as 1 or null for a scene without fog, so a sidecar of a fogless scene is byte-identical to one written before the field existed, and no consumer is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The doc states who writes the record, which performances produce one and in what order, how a consumer reads each member, and each member states its meaning, range and absence.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An interface describes data and runs no algorithm; the projection cost is answered on `planPoseKeypointSidecar`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One actor's keypoint record is plain data written once by the planner and shared by no phase.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The actor record holds only its node id, keypoint array and optional number inside its frame, and owns no handle.
 * @author Samchon
 */
export interface IAutoMoviePoseKeypointActor {
  /** Id of the performing actor's scene node. */
  node: string;

  /**
   * The actor's named joints projected to the frame, in
   * `resolvePoseKeypoints` order, with off-frame joints flagged rather than
   * clamped.
   */
  keypoints: IAutoMoviePoseKeypoint[];

  /**
   * Fraction of the actor's own color that survives the scene's fog at the
   * camera depth of the actor's world root: 1 at the lens, falling toward 0
   * with distance, from `sceneFogTransmittance` over the scene's fog.
   *
   * Screen coordinates alone do not say whether the subject standing there is
   * fully visible or barely separable from the haze, so a pose-conditioned
   * host reads this to know. Present only when the scene declares fog.
   */
  atmosphere?: number;
}
