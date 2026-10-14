import type * as THREE from "three";

/**
 * A named display light and its immutable-by-convention studio position copy.
 * Direction edits preserve the light's original distance and numerical model.
 *
 * @author Samchon
 * @evidence contracts/common.md#principled-implementation Associates a real directional studio light with an independent original display-position copy, so direction editing preserves its distance and can restore exact studio state; positions are metres and rest remains immutable by owner convention.
 * @evidence contracts/common.md#clear-and-simple-design Stores only the mutable native light and its rest vector beside the viewport's name registry, separating display lighting from numerical model/pose ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Original distance derives from the captured actual light, not a fixture target direction or a replaced native light method.
 * @evidence contracts/common.md#meaningful-documentation Gives named light purpose, original copied metre position and direction-only/display-only responsibility.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record performs no normalization, studio reset or native shadow calculation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The viewport reuses this captured rest during direction changes; the shape schedules no repeated work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Light/shadow maps remain viewport-owned and the rest vector is a small copied value; this type acquires no native handle/task.
 */
export interface IConnectedBodyInspectionLight {
  /** The existing scene light whose position is updated. */
  light: THREE.DirectionalLight;

  /** Independently copied original position, in display metres. */
  rest: THREE.Vector3;
}
