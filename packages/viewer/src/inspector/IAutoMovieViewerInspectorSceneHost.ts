import type {
  IAutoMovieRenderFilmIndirectRenderer,
  IAutoMovieRenderSectionRenderer,
} from "@automovie/render";
import type * as THREE from "three";

/**
 * What the inspector's scene mount takes from the page: a renderer, the
 * animation-frame clock and the canvas size.
 *
 * `AutoMovieViewerInspector.createCanvasHost` gives the browser's: a `WebGLRenderer`
 * on the canvas, `requestAnimationFrame` and the canvas's layout size. A unit
 * test gives recording doubles, so the mount's lifecycle runs without a
 * browser.
 */
export interface IAutoMovieViewerInspectorSceneHost {
  /**
   * Create the renderer one mount draws with; the mount disposes it when it
   * ends.
   */
  createRenderer(): IAutoMovieViewerInspectorSceneHost.ICreated;

  /**
   * Run `callback` once before the next repaint with the frame's time in
   * milliseconds, and return a handle `cancelFrame` takes.
   */
  requestFrame(callback: (nowMs: number) => void): number;

  /** Cancel a pending frame so its callback never runs. */
  cancelFrame(handle: number): void;

  /**
   * The size to draw at now: CSS pixels of the drawing area and the device
   * pixel ratio.
   */
  size(): IAutoMovieViewerInspectorSceneHost.ISize;
}
export namespace IAutoMovieViewerInspectorSceneHost {
  /** A created renderer and, when it is a WebGL one, that renderer as such. */
  export interface ICreated {
    /** The renderer the mount draws with. */
    renderer: IRenderer;

    /**
     * The same renderer as a `THREE.WebGLRenderer`, or null for one that is
     * not: a subject's render-target work and a transition's compositing need
     * its native targets.
     */
    compositor: THREE.WebGLRenderer | null;
  }

  /**
   * The part of `THREE.WebGLRenderer` the inspector's mount calls, including
   * what `AutoMovieRenderFilmResponseStage` and `AutoMovieRenderFilmIndirectStage` drive
   * when a subject supplies optics and shading.
   */
  export interface IRenderer
    extends IAutoMovieRenderSectionRenderer, IAutoMovieRenderFilmIndirectRenderer {
    /** Draw a scene through a camera into the canvas. */
    render(scene: THREE.Object3D, camera: THREE.Camera): void;

    /** Set the device pixel ratio the drawing buffer is scaled by. */
    setPixelRatio(ratio: number): void;

    /**
     * Size the drawing buffer in CSS pixels; `updateStyle` false leaves the
     * canvas's layout to the page.
     */
    setSize(width: number, height: number, updateStyle?: boolean): void;

    /**
     * Release the renderer's GPU resources. The context is not lost, so a later
     * renderer on the same canvas draws.
     */
    dispose(): void;
  }

  /** The drawing size the host reports. */
  export interface ISize {
    /** Drawing width, CSS pixels. */
    width: number;

    /** Drawing height, CSS pixels. */
    height: number;

    /** Device pixels per CSS pixel. */
    pixelRatio: number;
  }
}
