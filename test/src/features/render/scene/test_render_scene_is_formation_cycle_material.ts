import { type IAutoMovieRenderFormationCycle, AutoMovieRenderFormationCycle, AutoMovieRenderDualQuaternionSkinning } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createFormationCycleLiteral } from "../../internal/createFormationCycleLiteral";

/**
 * `isFormationCycleMaterial` finds the formation cycle's shader patch
 * among a material's patches.
 *
 * Scenarios:
 *
 * 1. A plain material, and one with only dual quaternion skinning, carry no cycle.
 * 2. A material with the cycle carries it, and still does after dual quaternion
 *    skinning is applied beside it, whose program key is no longer the cycle's
 *    alone.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases distinguish plain, skinning-only, cycle-only, and combined shader materials.
 * @evidence contracts/development/testing.md#behavioral-verification Checks that cycle detection stays true after a second shader patch changes the material program key, and stays false when the cycle was never applied.
 * @evidence contracts/development/testing.md#independent-expectations Compares with the expected booleans from the explicitly applied cycle and skinning patches.
 */
export function test_render_scene_is_formation_cycle_material(): void {
  const cycle: IAutoMovieRenderFormationCycle = createFormationCycleLiteral();
  const plain: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial();
  const skinned: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial();
  AutoMovieRenderDualQuaternionSkinning.apply(skinned);
  const both: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial();
  AutoMovieRenderFormationCycle.applyFormationCycleMaterial(both, cycle);
  const cycled: boolean = AutoMovieRenderFormationCycle.isAutoMovieFormationCycleMaterial(both);
  AutoMovieRenderDualQuaternionSkinning.apply(both);
  TestValidator.equals(
    "detections",
    [
      AutoMovieRenderFormationCycle.isAutoMovieFormationCycleMaterial(plain),
      AutoMovieRenderFormationCycle.isAutoMovieFormationCycleMaterial(skinned),
      cycled,
      AutoMovieRenderFormationCycle.isAutoMovieFormationCycleMaterial(both),
      both.customProgramCacheKey() !== "automovie-formation-cycle",
    ],
    [false, false, true, true, true],
  );
  for (const material of [plain, skinned, both]) material.dispose();
}
