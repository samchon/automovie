import type * as THREE from "three";

/**
 * The articulation subtrees one scene's props contribute.
 *
 * @evidence contracts/development/design.md#principled-representation Scene-qualified joint keys address actual Object3D frames, and restore reapplies captured local rest transforms before sampling clips so absent channels cannot retain a later frame's pose.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The runtime exposes only its joint registry and rest reset; buildPropArticulation owns construction and applyObjectMotions owns sampled channel writes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Joint addressing follows placementChildNode rather than a viewer-specific prefix; restoration treats every captured joint uniformly.
 * @evidence contracts/development/common.md#meaningful-documentation Documents the placement/joint key format and explains why backward seeks require restoring rest transforms before applying partial clips.
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
   * @evidence contracts/development/implementation.md#principled-implementation Copies captured rest-local translation, orientation and scale back onto every built joint before clip writes, so absent or backwards-seeked channels restore authored rest rather than previous output.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One callback hides rest snapshot storage while exposing the same frame reset obligation as staged node transforms.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts All registered prop joints reset uniformly; no missing channel is repaired with a clip-specific pose.
   * @evidence contracts/development/common.md#meaningful-documentation Explains backward seeking and partial channel playback as the reason callers must restore rest first.
   * @evidence contracts/development/implementation.md#efficient-algorithms The builder callback visits each captured joint once and copies existing transform objects without per-frame geometry allocation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Captured rest transforms are reused across frames because they represent immutable declared prop placement rather than sampled motion.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The callback retains one transform snapshot per built joint for the articulation handle's lifetime and creates no native GPU resources.
   */
  restore: () => void;
}
