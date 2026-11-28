import { AutoMovieRenderFormationCycle } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `selectFormationShadowPalette` picks the palette material of the geometry
 * group a shadow draw draws.
 *
 * Scenarios, over a geometry of three groups with material indices 0, 1, 1 and
 * a palette of two materials:
 *
 * 1. Group 0 selects the first material, groups 1 and 2 the second.
 * 2. No group, and a group the geometry does not hold, select the first.
 * 3. A group whose index the palette lacks is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases state geometry group indices, available palette entries, absent groups and a missing palette index.
 * @evidence contracts/development/testing.md#behavioral-verification Checks that shadow draws select the indexed material for actual groups, use the first material for the absent group cases, and refuse a group without a valid material.
 * @evidence contracts/development/testing.md#independent-expectations Compares original material identities against the fixture's explicit group indices 0, 1 and 1 and an out-of-range group.
 */
export function test_render_scene_select_formation_shadow_palette(): void {
  const geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
  geometry.addGroup(0, 3, 0);
  geometry.addGroup(3, 3, 1);
  geometry.addGroup(6, 3, 1);
  const palette: THREE.Material[] = [
    new THREE.MeshBasicMaterial(),
    new THREE.MeshBasicMaterial(),
  ];
  const [first, second, third] = geometry.groups;
  TestValidator.predicate(
    "drawn groups",
    AutoMovieRenderFormationCycle.selectFormationShadowPalette(geometry, palette, first!) === palette[0] &&
      AutoMovieRenderFormationCycle.selectFormationShadowPalette(geometry, palette, second!) === palette[1] &&
      AutoMovieRenderFormationCycle.selectFormationShadowPalette(geometry, palette, third!) === palette[1],
  );
  TestValidator.predicate(
    "no drawn group",
    AutoMovieRenderFormationCycle.selectFormationShadowPalette(geometry, palette, null) === palette[0] &&
      AutoMovieRenderFormationCycle.selectFormationShadowPalette(geometry, palette, new THREE.Group()) ===
        palette[0],
  );
  TestValidator.error("a missing palette index", (): unknown =>
    AutoMovieRenderFormationCycle.selectFormationShadowPalette(geometry, [palette[0]!], second!),
  );
  geometry.dispose();
  for (const material of palette) material.dispose();
}
