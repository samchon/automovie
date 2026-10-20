import type { IAutoMoviePropSpec, IAutoMovieScene } from "@automovie/interface";
import type * as THREE from "three";

import type { IAutoMovieModelObject } from "./IAutoMovieModelObject.js";

/**
 * Compiled prop declarations and already-built scene objects used to lower
 * articulation. The builder reparents referenced parts while preserving their
 * world placement and retains joint rest transforms for subsequent restoration.
 *
 * @evidence contracts/common.md#principled-implementation Joins compiled prop identities to the already-built scene's node/model registries; the builder saves joint-local rests during creation, then parents joints in their authored local frames and uses native attach to preserve each resolved part's existing world placement.
 * @evidence contracts/common.md#clear-and-simple-design Collects the existing scene/specification/lookup inputs for articulation lowering without creating another model or attachment service.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing placements/parts are refused rather than replaced with fixture objects; all parts use the same named-part resolution and world-preserving reparenting path.
 * @evidence contracts/common.md#meaningful-documentation Documents registry keys, built-scene premise, borrowed objects and the reparent/rest-restoration side effect.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This input shape chooses no joint-tree construction or world-transform algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record itself coordinates no repeat lowering or shared mutation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Borrowed maps/specs acquire no additional geometry, material or task; articulation and scene hosts own their lifetimes.
 */
export interface IBuildPropArticulationProps {
  /** Compiled scene whose placement groups have already been constructed. */
  scene: IAutoMovieScene;

  /**
   * Shot registry whose prop node identities match the compiled scene's models.
   */
  props: readonly IAutoMoviePropSpec[];

  /**
   * Existing placement groups by scene node id, borrowed for adding joint trees.
   */
  nodeObjects: ReadonlyMap<string, THREE.Object3D>;

  /**
   * Existing built models by scene node id; named parts may be reparented by the
   * builder, while unresolved parts or placements are refused.
   */
  modelObjects: ReadonlyMap<string, IAutoMovieModelObject>;
}
