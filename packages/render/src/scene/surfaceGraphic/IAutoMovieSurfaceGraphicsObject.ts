import type * as THREE from "three";

/**
 * A shot's surface graphics, built and mounted on their props.
 *
 * `prepareAutoMovieSurfaceGraphics` returns it. The caller owns it until
 * `dispose`.
 */
export interface IAutoMovieSurfaceGraphicsObject {
  /**
   * One root per track, in track order, each named
   * `surface-graphic:<node>/<surface>` and parented to its prop's model object
   * at the surface frame.
   */
  readonly roots: readonly THREE.Group[];

  /**
   * Show every track's key in force at shot-local `seconds` and hide its other
   * keys. Call it before drawing each frame. A time outside [0, duration)
   * throws a `RangeError` and changes nothing.
   */
  apply(seconds: number): void;

  /**
   * Draw every shown feed layer's camera view into its own render target, at
   * the scene's current placement; call it after `apply` and the scene's own
   * placement, before drawing the frame. Inside a feed every feed layer draws
   * as its graphic's background, so a screen never shows itself. The renderer's
   * render target is restored, and a camera `camera` cannot resolve throws.
   * Does nothing when no feed is shown.
   */
  renderFeeds(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: (id: string) => THREE.Camera | undefined,
  ): void;

  /**
   * Detach every root and release the geometries, materials, textures and feed
   * render targets the graphics own. Calling it again does nothing.
   */
  dispose(): void;
}
