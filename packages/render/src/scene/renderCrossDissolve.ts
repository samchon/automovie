import * as THREE from "three";

import type { AutoMovieDisplayCompositor } from "./internal/AutoMovieDisplayCompositor.js";
import { renderCrossDissolveFrames } from "./renderCrossDissolveFrames.js";

/**
 * Cross-dissolve two beauty poses of one scene through a caller-owned
 * compositor, optionally wrapping each draw.
 */
export const renderCrossDissolve: (
  renderer: THREE.WebGLRenderer,
  compositor: AutoMovieDisplayCompositor,
  scene: THREE.Scene,
  camera: THREE.Camera,
  poseOutgoing: () => void,
  poseIncoming: () => void,
  alpha: number,
  renderHalf?: (render: () => void) => void,
) => void = (
  renderer: THREE.WebGLRenderer,
  compositor: AutoMovieDisplayCompositor,
  scene: THREE.Scene,
  camera: THREE.Camera,
  poseOutgoing: () => void,
  poseIncoming: () => void,
  alpha: number,
  /**
   * Wrap each source draw, for example to own reversible source-local renderer
   * configuration. Structural guide products select their dominant layer before
   * rendering and must never use this beauty compositor.
   */
  renderHalf: (render: () => void) => void = (render: () => void): void =>
    render(),
): void =>
  renderCrossDissolveFrames(
    renderer,
    compositor,
    (): void => {
      poseOutgoing();
      renderHalf((): void => renderer.render(scene, camera));
    },
    (): void => {
      poseIncoming();
      renderHalf((): void => renderer.render(scene, camera));
    },
    alpha,
  );
