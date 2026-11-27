import * as THREE from "three";

import type { IAutoMovieInspectorSceneHost } from "../IAutoMovieInspectorSceneHost.js";

/**
 * The browser's scene host for one canvas: a `WebGLRenderer` drawing into it,
 * the window's animation frames, and the canvas's layout size with the device
 * pixel ratio.
 *
 * Each `createRenderer` call makes a new renderer on the same canvas, which
 * reuses the canvas's context, so a mount after a dispose draws; the mount
 * disposes each renderer without losing the context. A canvas that has no
 * layout size yet reports zero, and the mount skips drawing until it has one.
 */
export function createAutoMovieInspectorCanvasHost(
  canvas: HTMLCanvasElement,
): IAutoMovieInspectorSceneHost {
  const view: Window = canvas.ownerDocument.defaultView ?? window;
  return {
    createRenderer: (): IAutoMovieInspectorSceneHost.ICreated => {
      const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
      });
      return { renderer, compositor: renderer };
    },
    requestFrame: (callback: (nowMs: number) => void): number =>
      view.requestAnimationFrame(callback),
    cancelFrame: (handle: number): void => view.cancelAnimationFrame(handle),
    size: (): IAutoMovieInspectorSceneHost.ISize => ({
      width: canvas.clientWidth,
      height: canvas.clientHeight,
      pixelRatio: view.devicePixelRatio,
    }),
  };
}
