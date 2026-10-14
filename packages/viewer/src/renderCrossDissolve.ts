import * as THREE from "three";
import {renderCrossDissolveFrames} from "./renderCrossDissolveFrames.js";

/**
 * Cross-dissolve two beauty poses of one scene, optionally wrapping each draw.
 *
 * @evidence contracts/common.md#principled-implementation Wraps two pose resolutions and actual scene draws into the existing display-frame dissolve owner, giving each source an optional reversible render wrapper.
 * @evidence contracts/common.md#clear-and-simple-design Pose/state resolution remains caller-owned while alpha admission, display-copy composition and native state restoration belong to renderCrossDissolveFrames.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Structural guide products must select their dominant layer before this beauty path; no pixel identity is inferred from the shared scene object or equal pose metadata.
 * @evidence contracts/common.md#meaningful-documentation Documents two beauty poses and wrapper responsibility for source-local rendering configuration.
 * @evidence contracts/performance.md#efficient-algorithms Adapter coordination is fixed around exactly two pose/wrapper callbacks, with native draw and display compositor costs delegated.
 * @evidence contracts/performance.md#reuse-equivalent-work Both callbacks use the same borrowed scene/camera but resolve their actual source state independently; renderer-scoped copy reuse is owned by the downstream compositor.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains no owner after return and acquires no geometry/target; caller owns scene/camera and the renderer compositor owns its copied display resources.
 */
export const renderCrossDissolve: (renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, poseOutgoing: () => void, poseIncoming: () => void, alpha: number, renderHalf?: (render: () => void) => void) => void = (
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  poseOutgoing: () => void,
  poseIncoming: () => void,
  alpha: number,
  /**
   * Wrap each source draw, for example to own reversible source-local renderer
   * configuration. Structural guide products select their dominant layer
   * before rendering and must never use this beauty compositor.
   */
  renderHalf: (render: () => void) => void = (render: () => void) : void => render(),
): void =>
  renderCrossDissolveFrames(
    renderer,
    () : void => {
      poseOutgoing();
      renderHalf(() : void => renderer.render(scene, camera));
    },
    () : void => {
      poseIncoming();
      renderHalf(() : void => renderer.render(scene, camera));
    },
    alpha,
  );

