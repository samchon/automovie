import { createFormationCycleShadowMaterials } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createFormationCycleLiteral } from "../../internal/createFormationCycleLiteral";

/**
 * `createFormationCycleShadowMaterials` gives a tier's cycle a depth and a
 * distance material whose program identity follows the palette material each
 * shadow draw stands for.
 *
 * Scenarios, over a palette [a, b, a] of two distinct materials:
 *
 * 1. Before any draw both projections share the key of identity 0,
 *    `automovie-formation-cycle:shadow-palette:0`.
 * 2. A draw for b selects identity 1 and asks the drawn material to update; a draw
 *    for a returns both keys to identity 0, the identity a keeps however often
 *    the palette repeats it.
 */
export function test_render_scene_create_formation_cycle_shadow_materials(): void {
  const a: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial();
  const b: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial();
  const shadows: ReturnType<typeof createFormationCycleShadowMaterials> =
    createFormationCycleShadowMaterials(createFormationCycleLiteral(), [
      a,
      b,
      a,
    ]);
  const keys: () => string[] = (): string[] => [
    shadows.depth.customProgramCacheKey(),
    shadows.distance.customProgramCacheKey(),
  ];
  const first: string = "automovie-formation-cycle:shadow-palette:0";
  TestValidator.equals("before any draw", keys(), [first, first]);
  const version: number = shadows.depth.version;
  shadows.beforeDraw(shadows.depth, b);
  const second: string = "automovie-formation-cycle:shadow-palette:1";
  TestValidator.equals(
    "a draw for b",
    [...keys(), shadows.depth.version],
    [second, second, version + 1],
  );
  shadows.beforeDraw(shadows.distance, a);
  TestValidator.equals("a draw for a", keys(), [first, first]);
  shadows.dispose();
  a.dispose();
  b.dispose();
}
