import type { IAutoMovieFormationCycle } from "@automovie/render";
import {
  applyDualQuaternionSkinning,
  applyFormationCycleMaterial,
  isAutoMovieFormationCycleMaterial,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createFormationCycleLiteral } from "../../../internal/createFormationCycleLiteral";

/**
 * `isAutoMovieFormationCycleMaterial` finds the formation cycle's shader patch
 * among a material's patches.
 *
 * Scenarios:
 *
 * 1. A plain material, and one with only dual quaternion skinning, carry no cycle.
 * 2. A material with the cycle carries it, and still does after dual quaternion
 *    skinning is applied beside it, whose program key is no longer the cycle's
 *    alone.
 */
export function test_unit_render_scene_is_formation_cycle_material(): void {
  const cycle: IAutoMovieFormationCycle = createFormationCycleLiteral();
  const plain: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial();
  const skinned: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial();
  applyDualQuaternionSkinning(skinned);
  const both: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial();
  applyFormationCycleMaterial(both, cycle);
  const cycled: boolean = isAutoMovieFormationCycleMaterial(both);
  applyDualQuaternionSkinning(both);
  TestValidator.equals(
    "detections",
    [
      isAutoMovieFormationCycleMaterial(plain),
      isAutoMovieFormationCycleMaterial(skinned),
      cycled,
      isAutoMovieFormationCycleMaterial(both),
      both.customProgramCacheKey() !== "automovie-formation-cycle",
    ],
    [false, false, true, true, true],
  );
  for (const material of [plain, skinned, both]) material.dispose();
}
