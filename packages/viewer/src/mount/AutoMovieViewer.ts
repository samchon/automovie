import type * as THREE from "three";

import type { IAutoMovieViewerHandle } from "../IAutoMovieViewerHandle.js";
import type { IMountViewerOptions } from "../IMountViewerOptions.js";
import { mountViewer } from "./internal/mountViewer.js";
import { releaseMountedViewer } from "./internal/releaseMountedViewer.js";

/** Owns the imperative browser viewer's mount and renderer retirement lifecycle. */
export namespace AutoMovieViewer {
  /** Produce one frame and optionally report that drawing is complete. */
  export type FrameProducer =
    | ((elapsedSeconds: number) => boolean)
    | ((elapsedSeconds: number) => void);

  /**
   * Mount a render loop on a canvas and return its controls. `onFrame` runs
   * once per animation frame; return `true` when it handled drawing itself.
   * Calling the returned handle's `stop()` releases the loop, scene shadow
   * products and renderer.
   */
  export function mount(
    canvas: HTMLCanvasElement,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    onFrame: FrameProducer,
    options?: IMountViewerOptions,
  ): IAutoMovieViewerHandle {
    return mountViewer(canvas, scene, camera, onFrame, options);
  }

  /**
   * End a loop, its native scene shadow products and owned renderer. The loop
   * must stop scheduling first; geometry and materials remain caller-owned.
   */
  export function release(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    stopLoop: () => void,
  ): void {
    releaseMountedViewer(renderer, scene, stopLoop);
  }
}
