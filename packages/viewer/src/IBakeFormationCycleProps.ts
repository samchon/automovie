import type { IAutoMovieModel } from "@automovie/interface";
import type * as THREE from "three";

import type { IAutoMovieModelObject } from "./IAutoMovieModelObject";

/**
 * One figure's rest model and ordered rigid parts used to bake its repertoire.
 * Geometry extraction precedes the bake because sampling changes the supplied
 * runtime object's pose and leaves it at the last sampled frame.
 *
 * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Binds one declared model, its mutable pose projection, ordered rest parts and sample count to the gait table used by unit cadence.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-member-exception-command-event Binds one declared model, its mutable pose projection, ordered rest parts and sample count to the gait table used by unit cadence.
 * @author Samchon
 */
export interface IBakeFormationCycleProps {
  /**
   * Caller-owned compiled figure carrying the skeleton and gait profiles.
   * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Binds one declared model, its mutable pose projection, ordered rest parts and sample count to the gait table used by unit cadence.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-member-exception-command-event Binds one declared model, its mutable pose projection, ordered rest parts and sample count to the gait table used by unit cadence.
   */
  model: IAutoMovieModel;

  /**
   * Mutable built model initially at rest with world matrices current; the
   * bake samples poses through applyPose and leaves the final sample applied.
   * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Binds one declared model, its mutable pose projection, ordered rest parts and sample count to the gait table used by unit cadence.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-member-exception-command-event Binds one declared model, its mutable pose projection, ordered rest parts and sample count to the gait table used by unit cadence.
   */
  built: IAutoMovieModelObject;

  /**
   * Rigid meshes in instancedModelParts traversal order, matching the flattened
   * geometry's part attribute. Their world-rest matrices are read before poses.
   * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Binds one declared model, its mutable pose projection, ordered rest parts and sample count to the gait table used by unit cadence.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-member-exception-command-event Binds one declared model, its mutable pose projection, ordered rest parts and sample count to the gait table used by unit cadence.
   */
  parts: readonly THREE.Mesh[];

  /**
   * Even samples across one cycle; omission uses AUTOMOVIE_FORMATION_CYCLE_SAMPLES.
   * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Binds one declared model, its mutable pose projection, ordered rest parts and sample count to the gait table used by unit cadence.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-member-exception-command-event Binds one declared model, its mutable pose projection, ordered rest parts and sample count to the gait table used by unit cadence.
   */
  samples?: number;
}
