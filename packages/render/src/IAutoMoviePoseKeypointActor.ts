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
 * @evidence contracts/development/design.md#principled-representation The record keeps resolvePoseKeypoints output including joint order and off-frame flags, plus sceneFogTransmittance at the actor's root camera depth. That binary64 scalar predicts the viewer's fog law; GPU precision, per-joint depth variation, lighting and compositing prevent claiming exact captured-pixel agreement.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One record holds node identity, projected joints and an optional root-sampled atmosphere fraction. Per-joint fog is absent, so depth variation across an actor is an approximation rather than a proven negligible visual difference.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `atmosphere` is omitted rather than written as 1 or null for a scene without fog, so a sidecar of a fogless scene is byte-identical to one written before the field existed, and no consumer is special-cased.
 * @evidence contracts/development/common.md#meaningful-documentation The doc states who writes the record, which performances produce one and in what order, how a consumer reads each member, and each member states its meaning, range and absence.
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
