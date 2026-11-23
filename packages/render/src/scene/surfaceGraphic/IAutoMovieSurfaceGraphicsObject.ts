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
   * Detach every root and release the geometries, materials and textures the
   * graphics own. Calling it again does nothing.
   */
  dispose(): void;
}
