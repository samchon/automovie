import { AutoMovieRenderInspectionPath } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `AutoMovieRenderInspectionPath.entityPathOf` names an object by its named ancestors,
 * telling same-named siblings apart and unnamed nodes by child index.
 *
 * Scenarios:
 *
 * 1. `hero/arm` under the root is `hero/arm`; the root itself, with nothing
 *    named, is `scene`.
 * 2. Two siblings named `leg` are `leg#0` and `leg#1`.
 * 3. An unnamed object under a named one adds `.children[<index>]`.
 * 4. An object outside the root is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scene describes named ancestors, duplicate siblings, unnamed children, root fallback, and an object outside the root.
 * @evidence contracts/development/testing.md#behavioral-verification Checks that entity paths distinguish same-named siblings and unnamed children, give the root a stable fallback, and refuse objects beyond the root.
 * @evidence contracts/development/testing.md#independent-expectations Compares with literal paths `hero/arm`, `scene`, `hero/leg#0`, `hero/leg#1`, and `hero.children[3]`.
 */
export function test_render_scene_inspection_entity_path_of(): void {
  const named = (name: string): THREE.Object3D => {
    const object: THREE.Object3D = new THREE.Object3D();
    object.name = name;
    return object;
  };
  const root: THREE.Group = new THREE.Group();
  const hero: THREE.Object3D = named("hero");
  const arm: THREE.Object3D = named("arm");
  const legA: THREE.Object3D = named("leg");
  const legB: THREE.Object3D = named("leg");
  const bare: THREE.Object3D = new THREE.Object3D();
  root.add(hero);
  hero.add(arm, legA, legB, bare);
  TestValidator.equals("nested", AutoMovieRenderInspectionPath.entityPathOf({ root, object: arm }), "hero/arm");
  TestValidator.equals("root", AutoMovieRenderInspectionPath.entityPathOf({ root, object: root }), "scene");
  TestValidator.equals("first twin", AutoMovieRenderInspectionPath.entityPathOf({ root, object: legA }), "hero/leg#0");
  TestValidator.equals("second twin", AutoMovieRenderInspectionPath.entityPathOf({ root, object: legB }), "hero/leg#1");
  TestValidator.equals("unnamed", AutoMovieRenderInspectionPath.entityPathOf({ root, object: bare }), "hero.children[3]");
  TestValidator.error("outside", (): void => {
    AutoMovieRenderInspectionPath.entityPathOf({ root, object: named("stray") });
  });
}