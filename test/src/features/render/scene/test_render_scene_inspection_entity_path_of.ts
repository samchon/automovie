import { autoMovieInspectionEntityPathOf } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `autoMovieInspectionEntityPathOf` names an object by its named ancestors,
 * telling same-named siblings apart and unnamed nodes by child index.
 *
 * Scenarios:
 *
 * 1. `hero/arm` under the root is `hero/arm`; the root itself, with nothing
 *    named, is `scene`.
 * 2. Two siblings named `leg` are `leg#0` and `leg#1`.
 * 3. An unnamed object under a named one adds `.children[<index>]`.
 * 4. An object outside the root is refused.
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
  TestValidator.equals("nested", autoMovieInspectionEntityPathOf(root, arm), "hero/arm");
  TestValidator.equals("root", autoMovieInspectionEntityPathOf(root, root), "scene");
  TestValidator.equals("first twin", autoMovieInspectionEntityPathOf(root, legA), "hero/leg#0");
  TestValidator.equals("second twin", autoMovieInspectionEntityPathOf(root, legB), "hero/leg#1");
  TestValidator.equals("unnamed", autoMovieInspectionEntityPathOf(root, bare), "hero.children[3]");
  TestValidator.error("outside", (): void => {
    autoMovieInspectionEntityPathOf(root, named("stray"));
  });
}