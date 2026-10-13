import type { IAutoMovieModel } from "@automovie/interface";
import type * as THREE from "three";

import type { IAutoMovieModelObject } from "./IAutoMovieModelObject.js";

/**
 * One figure's rest model and ordered rigid parts used to bake its repertoire.
 * Geometry extraction precedes the bake because sampling changes the supplied
 * runtime object's pose and leaves it at the last sampled frame.
 *
 * @author Samchon
 */
export interface IBakeFormationCycleProps {
  /** Caller-owned compiled figure carrying the skeleton and gait profiles. */
  model: IAutoMovieModel;

  /**
   * Mutable built model initially at rest with world matrices current; the
   * bake samples poses through applyPose and leaves the final sample applied.
   */
  built: IAutoMovieModelObject;

  /**
   * Rigid meshes in instancedModelParts traversal order, matching the flattened
   * geometry's part attribute. Their world-rest matrices are read before poses.
   */
  parts: readonly THREE.Mesh[];

  /**
   * Even samples across one cycle; omission uses AUTOMOVIE_FORMATION_CYCLE_SAMPLES.
   */
  samples?: number;
}
