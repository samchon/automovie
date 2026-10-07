import type { IAutoMovieModel } from "@automovie/interface";
import type * as THREE from "three";

import type { IAutoMovieModelObject } from "./IAutoMovieModelObject";

/**
 * One figure's rest model and ordered rigid parts used to bake its repertoire.
 * Geometry extraction precedes the bake because sampling changes the supplied
 * runtime object's pose and leaves it at the last sampled frame.
 *
 * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Supplies the figure whose declared gait repertoire determines the formation's cycle response.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-determinism-status-compatibility Keeps the ordered rest parts and sampling choice explicit for deterministic cycle construction.
 * @author Samchon
 */
export interface IBakeFormationCycleProps {
  /**
   * Caller-owned compiled figure carrying the skeleton and gait profiles.
   * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Carries the declared gait repertoire consumed by the bake.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-determinism-status-compatibility Keeps the compiled source model distinct from its mutable runtime projection.
   */
  model: IAutoMovieModel;

  /**
   * Mutable built model initially at rest with world matrices current; the
   * bake samples poses through applyPose and leaves the final sample applied.
   * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Supplies the same pose application path used by named performers.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-determinism-status-compatibility Defines the runtime state mutated while producing the fixed sample table.
   */
  built: IAutoMovieModelObject;

  /**
   * Rigid meshes in instancedModelParts traversal order, matching the flattened
   * geometry's part attribute. Their world-rest matrices are read before poses.
   * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Keeps each animated part associated with its own cycle matrix row.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-determinism-status-compatibility Preserves the shared ordering used by the bake and instanced geometry.
   */
  parts: readonly THREE.Mesh[];

  /**
   * Even samples across one cycle; omission uses AUTOMOVIE_FORMATION_CYCLE_SAMPLES.
   * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Supplies the temporal resolution of the declared gait cycle.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-determinism-status-compatibility Keeps the explicit sample count reproducible across cycle construction.
   */
  samples?: number;
}
