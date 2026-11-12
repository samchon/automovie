import type { IAutoMovieMark } from "@automovie/engine";
import type * as THREE from "three";

/**
 * Marks the inspection measured on one scene object, with the call that moves them to the object's current pose.
 *
 * @evidence contracts/development/design.md#principled-representation A measured mark lies on a posed surface, so its coordinates are read from the object as it is posed now; the record pairs the marks with the object that carries their frame and the call that rereads them, so the marks stay plain data a legend and a selection read like any other.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Produced by the inspection's measured kinds and read by `applyAutoMovieInspection`; the anchor is borrowed from the scene.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The anchor is the measured object itself rather than its path, so two meshes that share a path keep their own marks.
 * @evidence contracts/development/common.md#meaningful-documentation States what the record holds and when its call is made.
 */
export interface IAutoMovieInspectionMeasured {
  /** The object the marks were measured on, whose local frame their coordinates are in. */
  anchor: THREE.Object3D;

  /** The marks, in the anchor's local frame. */
  marks: IAutoMovieMark[];

  /**
   * Rewrite the marks' coordinates in place from the anchor's current pose. Call it after the scene's time or pose changes and before the marks are drawn.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is rewritten and when to call it.
   * @evidence contracts/development/implementation.md#principled-implementation Each mark keeps the vertex indices it was measured at, so its coordinates are those vertices' current posed positions.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call with no argument: the producer holds the anchor and the indices.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is measured again: topology does not change with pose, only positions do.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the marked vertices, not in the mesh.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The marks' arrays are rewritten in place.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Allocates nothing that outlives the call.
   */
  refresh: () => void;
}
