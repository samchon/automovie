import type * as THREE from "three";

/**
 * Marks built into drawable objects, with the three things their owner does with them: move them with their sources, size their lines to the draw target, and release them.
 *
 * @evidence contracts/development/design.md#principled-representation Marks are drawn as pixel-wide line segments and screen-sized points, so one object carries every mark of one build and its owner moves and releases them together.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The object and the three calls the inspection makes; the marks, anchors and buffers stay inside the builder.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The object holds ordinary three.js lines and points, so every renderer that draws three.js draws it without a branch for inspection.
 * @evidence contracts/development/common.md#meaningful-documentation States what the object is and when each call is made.
 */
export interface IAutoMovieInspectionOverlay {
  /**
   * The drawable marks. The caller adds it to the scene; it places itself on `update`.
   */
  object: THREE.Object3D;

  /**
   * Put the marks where their marks' coordinates and anchors are now. Call it after the scene's time or pose changes and its world matrices are current.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what moves, when to call it and the precondition on world matrices.
   * @evidence contracts/development/implementation.md#principled-implementation Every vertex is rewritten from its mark's current coordinates, and each anchored group takes its anchor's current world matrix.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call with no argument: the builder already holds the marks and anchors.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is cached across calls, so a mark cannot stay at an earlier frame's place.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the drawn vertices.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The buffers built once are rewritten in place.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Allocates nothing that outlives the call.
   */
  update: () => void;

  /**
   * Set the size, in pixels, of the target the lines are drawn into, so a line is the stroke width in that target's pixels.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the size is and what it decides.
   * @evidence contracts/development/implementation.md#principled-implementation A screen-space line's width is converted from pixels to clip space through its material's resolution.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One assignment per line material.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Points need no size: their width is in pixels already.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant per line object.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work An assignment computes nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Allocates nothing.
   */
  resize: (width: number, height: number) => void;

  /**
   * Take the object out of its parent and release its geometries and materials.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both effects.
   * @evidence contracts/development/implementation.md#principled-implementation The builder created the objects, geometries and materials, so it retires all of them and nothing of an anchor.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call undoes the build and the caller's attachment together.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An anchor object, its geometry and its materials are never released here.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the built objects.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A release computes nothing to reuse.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources After the call the overlay holds no GPU resource and the scene holds no reference to it.
   */
  dispose: () => void;
}
