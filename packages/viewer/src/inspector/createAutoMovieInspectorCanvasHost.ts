import * as THREE from "three";

import type { IAutoMovieInspectorSceneHost } from "./IAutoMovieInspectorSceneHost.js";

/**
 * The browser's scene host for one canvas: a `WebGLRenderer` drawing into it, the window's animation frames, and the canvas's layout size with the device pixel ratio.
 *
 * Each `createRenderer` call makes a new renderer on the same canvas, which reuses the canvas's context, so a mount after a dispose draws; the mount disposes each renderer without losing the context. A canvas that has no layout size yet reports zero, and the mount skips drawing until it has one.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each member is in a browser, the context reuse across mounts and the zero-size case.
 * @evidence contracts/development/implementation.md#principled-implementation `requestAnimationFrame` paces drawing to the display and stops in a hidden tab; `clientWidth` and `clientHeight` are the CSS size the page laid out, and `devicePixelRatio` scales the buffer to device pixels.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Four one-line members over the canvas and its window.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No global is replaced; the canvas's own window is used, so a canvas in another frame paces by that frame.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant per call.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A host computes nothing to reuse; the mount reuses its renderer.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds the borrowed canvas only; each renderer it creates is owned and disposed by the mount that asked for it.
 */
export function createAutoMovieInspectorCanvasHost(
  canvas: HTMLCanvasElement,
): IAutoMovieInspectorSceneHost {
  const view: Window = canvas.ownerDocument.defaultView ?? window;
  return {
    createRenderer: (): IAutoMovieInspectorSceneHost.IRenderer =>
      new THREE.WebGLRenderer({ canvas, antialias: true }),
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
