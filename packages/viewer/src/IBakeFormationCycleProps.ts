import type { IAutoMovieModel } from "@automovie/interface";
import type * as THREE from "three";

import type { IAutoMovieModelObject } from "./IAutoMovieModelObject.js";

/**
 * One figure's rest model and ordered rigid parts used to bake its repertoire.
 * Geometry extraction precedes the bake because sampling changes the supplied
 * runtime object's pose and leaves it at the last sampled frame.
 *
 * @evidence contracts/common.md#principled-implementation Supplies one compiled figure, its rest-positioned built model and ordered rigid parts so bakeFormationCycle can measure posed matrices against exactly the rest geometry extracted for instancing.
 * @evidence contracts/common.md#clear-and-simple-design Keeps model semantics, mutable playback target and ordered drawable parts explicit rather than rediscovering traversal order inside each gait sample.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sampling uses the model's actual gait and skeleton through applyPose; no preauthored motion table is embedded in these bake inputs.
 * @evidence contracts/common.md#meaningful-documentation States rest/world-matrix prerequisites, extraction-before-bake order, final-pose mutation and default cycle-sample behavior.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The props record performs no part traversal or gait-table construction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Its inputs describe one bake, while representation creation decides reuse across anonymous members and tiers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Model and parts are borrowed for baking; ownership of emitted table textures transfers to the returned formation representation.
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
