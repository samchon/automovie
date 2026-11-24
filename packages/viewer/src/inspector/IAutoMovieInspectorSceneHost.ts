import type {
  IAutoMovieFilmIndirectRenderer,
  IAutoMovieSectionRenderer,
} from "@automovie/render";
import type * as THREE from "three";

/**
 * What the inspector's scene mount takes from the page: a renderer, the
 * animation-frame clock and the canvas size.
 *
 * `createAutoMovieInspectorCanvasHost` gives the browser's: a `WebGLRenderer`
 * on the canvas, `requestAnimationFrame` and the canvas's layout size. A unit
 * test gives recording doubles, so the mount's lifecycle runs without a
 * browser.
 */
export interface IAutoMovieInspectorSceneHost {
  /**
   * Create the renderer one mount draws with; the mount disposes it when it
   * ends.
   */
  createRenderer(): IAutoMovieInspectorSceneHost.IRenderer;

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
  size(): IAutoMovieInspectorSceneHost.ISize;

  /**
   * Optional sound: the files a subject's sound list names and a player for the
   * master mixed from them. Absent, the inspector plays no sound.
   */
  sound?: IAutoMovieInspectorSceneHost.ISound;
}
export namespace IAutoMovieInspectorSceneHost {
  /** The production's sound files and the device that plays a master. */
  export interface ISound {
    /** Read one production-relative file whole; reject when it cannot be read. */
    read(path: string): Promise<Uint8Array>;

    /** Decode a 48 kHz stereo 16-bit WAVE master for playback. */
    load(wav: Uint8Array): Promise<ISoundtrack>;
  }

  /** A decoded master, sample 0 at film second 0. */
  export interface ISoundtrack {
    /** Play from a film second at a rate, replacing any playback started. */
    play(seconds: number, rate: number): void;

    /** Stop playing. */
    stop(): void;

    /** Stop and release the decoded master. */
    dispose(): void;
  }

  /**
   * The part of `THREE.WebGLRenderer` the inspector's mount calls, including
   * what `AutoMovieFilmResponseStage` and `AutoMovieFilmIndirectStage` drive
   * when a subject supplies optics and shading.
   */
  export interface IRenderer
    extends IAutoMovieSectionRenderer, IAutoMovieFilmIndirectRenderer {
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
