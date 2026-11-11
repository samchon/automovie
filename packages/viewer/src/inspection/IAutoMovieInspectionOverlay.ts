import type * as THREE from "three";

import type { IAutoMovieInspectionLegendEntry } from "./IAutoMovieInspectionLegendEntry.js";

/**
 * One set of inspection marks as a drawable object, with what its colours mean and the two things its owner does with it: move it with its source, and release it.
 *
 * @evidence contracts/development/design.md#principled-representation Marks are drawn as line segments with a colour per vertex, so one object carries every mark of one source and the legend names the colours it holds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The object, its legend and the two calls its owner makes; the source and the buffers stay inside the builder.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The object is an ordinary three.js line object, so the browser renderer and the CPU rasterizer draw it without a branch for inspection.
 * @evidence contracts/development/common.md#meaningful-documentation States what the object is, what the legend covers and when each call is made.
 */
export interface IAutoMovieInspectionOverlay {
  /**
   * The marks. The caller adds it to the scene; it places itself on `update`.
   */
  object: THREE.LineSegments;

  /**
   * One entry per colour this object draws.
   */
  legend: IAutoMovieInspectionLegendEntry[];

  /**
   * Put the marks where their source is now. Call it after the scene's time or pose changes and its world matrices are current.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what moves, when to call it and the precondition on world matrices.
   * @evidence contracts/development/implementation.md#principled-implementation The marks are placed from the source's current world matrix, and from its current posed vertices where the marks lie on a surface.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call with no argument: the builder already holds the source.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is cached across calls, so a mark cannot stay at an earlier frame's place.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the marks drawn, not in the source's size.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The buffers built once are rewritten in place.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Allocates nothing that outlives the call.
   */
  update: () => void;

  /**
   * Take the object out of its parent and release its geometry and material.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both effects.
   * @evidence contracts/development/implementation.md#principled-implementation The overlay created the object, the geometry and the material, so it retires all three and nothing of the source.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call undoes the build and the caller's attachment together.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The source object, its geometry and its materials are never released here.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A release computes nothing to reuse.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources After the call the overlay holds no GPU resource and the scene holds no reference to it.
   */
  dispose: () => void;
}
