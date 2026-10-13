import * as THREE from "three";
import {renderCrossDissolveFrames} from "./renderCrossDissolveFrames.js";

/**
 * Cross-dissolve two beauty poses of one scene, optionally wrapping each draw.
 */
export const renderCrossDissolve = (
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
  renderHalf: (render: () => void) => void = (render) => render(),
): void =>
  renderCrossDissolveFrames(
    renderer,
    () => {
      poseOutgoing();
      renderHalf(() => renderer.render(scene, camera));
    },
    () => {
      poseIncoming();
      renderHalf(() => renderer.render(scene, camera));
    },
    alpha,
  );

