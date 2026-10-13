import type { IAutoMoviePropSpec, IAutoMovieScene } from "@automovie/interface";
import type * as THREE from "three";

import type { IAutoMovieModelObject } from "./IAutoMovieModelObject.js";

/**
 * Compiled prop declarations and already-built scene objects used to lower
 * articulation. The builder reparents referenced parts while preserving their
 * world placement and retains joint rest transforms for subsequent restoration.
 *
 * @author Samchon
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
