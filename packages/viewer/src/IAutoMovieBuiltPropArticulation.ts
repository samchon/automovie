import type * as THREE from "three";

/**
 * The articulation subtrees one scene's props contribute.
 *
 * @evidence contracts/common.md#principled-implementation Scene-qualified joint keys address actual Object3D frames, and restore reapplies captured local rest transforms before sampling clips so absent channels cannot retain a later frame's pose.
 * @evidence contracts/common.md#clear-and-simple-design The runtime exposes only its joint registry and rest reset; buildPropArticulation owns construction and applyObjectMotions owns sampled channel writes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Joint addressing follows placementChildNode rather than a viewer-specific prefix; restoration treats every captured joint uniformly.
 * @evidence contracts/common.md#meaningful-documentation Documents the placement/joint key format and explains why backward seeks require restoring rest transforms before applying partial clips.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The articulation handle describes a registry and callback; the builder and restore implementation choose their traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No repeated requests run in this interface; its producer captures rest transforms once for successive resets.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The handle's referenced scene objects remain scene-owned; declaring the callback acquires no additional native resource.
 */
export interface IAutoMovieBuiltPropArticulation {
  /**
   * Every lowered joint by its scene id (`<placement>/<joint>`), which is the
   * name a shot's `objectMotions` track addresses it by.
   */
  joints: ReadonlyMap<string, THREE.Object3D>;

  /**
   * Put every joint back where its prop declares it stands.
   *
   * The same obligation a host already has for staged node transforms:
   * {@link applyObjectMotions} writes only the channels the clip carries and the
   * engine's own resolver falls back to rest instead, so a host that seeks
   * backwards past a clip's first key would otherwise keep whatever the last
   * draw left behind.
   *
   * @evidence contracts/common.md#principled-implementation Copies captured rest-local translation, orientation and scale back onto every built joint before clip writes, so absent or backwards-seeked channels restore authored rest rather than previous output.
   * @evidence contracts/common.md#clear-and-simple-design One callback hides rest snapshot storage while exposing the same frame reset obligation as staged node transforms.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts All registered prop joints reset uniformly; no missing channel is repaired with a clip-specific pose.
   * @evidence contracts/common.md#meaningful-documentation Explains backward seeking and partial channel playback as the reason callers must restore rest first.
   * @evidence contracts/performance.md#efficient-algorithms The builder callback visits each captured joint once and copies existing transform objects without per-frame geometry allocation.
   * @evidence contracts/performance.md#reuse-equivalent-work Captured rest transforms are reused across frames because they represent immutable declared prop placement rather than sampled motion.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The callback retains one transform snapshot per built joint for the articulation handle's lifetime and creates no native GPU resources.
   */
  restore: () => void;
}
