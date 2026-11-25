import type * as THREE from "three";

/**
 * Marks built into drawable objects, with the three things their owner does
 * with them: move them with their sources, size their lines to the draw target,
 * and release them.
 */
export interface IAutoMovieInspectionOverlay {
  /**
   * The drawable marks. The caller adds it to the scene; it places itself on
   * `update`.
   */
  object: THREE.Object3D;

  /**
   * Put the marks where their marks' coordinates and anchors are now. Call it
   * after the scene's time or pose changes and its world matrices are current.
   */
  update: () => void;

  /**
   * Set the size, in pixels, of the target the lines are drawn into, so a line
   * is the stroke width in that target's pixels.
   */
  resize: (width: number, height: number) => void;

  /** Take the object out of its parent and release its geometries and materials. */
  dispose: () => void;
}
