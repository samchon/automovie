import type { IAutoMovieConstructionCurve } from "@automovie/engine";
import type * as THREE from "three";

/**
 * The construction curves of one built form and the scene object whose space they are in.
 *
 * The curves are the form at rest. They follow `parent` as it moves, and a skinned surface that is posed away from rest leaves them behind, so they are read on the rest pose.
 *
 * A curve's inspection path is the path of `parent` followed by the curve's `part`, which is how a selection pattern shows or hides it with the surface it built.
 *
 * @evidence contracts/development/design.md#principled-representation The engine samples curves in the space of the realization they come from, so the record pairs them with the one object that carries that space into the scene.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two members: the engine's own curve records untouched, and a borrowed scene object. The viewer samples nothing and owns no curve type.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The parent is a reference, not a name looked up later, so two forms with the same name cannot take each other's curves.
 * @evidence contracts/development/common.md#meaningful-documentation States the space, what the curves follow and what leaves them behind, and how a curve's path is formed.
 */
export interface IAutoMovieInspectionConstruction {
  /**
   * The object whose local space the curve points are in. It is the inspected scene or beneath it.
   */
  parent: THREE.Object3D;

  /**
   * The curves, as `sampleAutoMovieConstructionCurves` returns them.
   */
  curves: readonly IAutoMovieConstructionCurve[];
}
