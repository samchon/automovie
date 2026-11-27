import { AutoMovieRenderInspectionPath } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `AutoMovieRenderInspectionPath.pathOf` joins the names from a root to an object, and
 * `listInspectionPaths` lists every drawn object by that path.
 *
 * Scenarios:
 *
 * 1. Under a root, `hero` holding an unnamed group holding `arm` has the path
 *    `hero/arm`, the root itself the empty path.
 * 2. An object outside the root is refused.
 * 3. Only meshes, lines, points and sprites are listed, in traversal order.
 */
export function test_render_scene_inspection_path_of(): void {
  const root: THREE.Group = new THREE.Group();
  const hero: THREE.Mesh = new THREE.Mesh();
  hero.name = "hero";
  const group: THREE.Group = new THREE.Group();
  const arm: THREE.Mesh = new THREE.Mesh();
  arm.name = "arm";
  const wire: THREE.Line = new THREE.Line();
  wire.name = "wire";
  const dots: THREE.Points = new THREE.Points();
  dots.name = "dots";
  const sprite: THREE.Sprite = new THREE.Sprite();
  sprite.name = "sprite";
  root.add(hero, dots, sprite);
  hero.add(group);
  group.add(arm, wire);

  TestValidator.equals("nested", AutoMovieRenderInspectionPath.pathOf({ root, object: arm }), "hero/arm");
  TestValidator.equals("root", AutoMovieRenderInspectionPath.pathOf({ root, object: root }), "");
  TestValidator.error("outside", (): void => {
    AutoMovieRenderInspectionPath.pathOf({ root, object: new THREE.Object3D() });
  });
  TestValidator.equals(
    "listed",
    AutoMovieRenderInspectionPath.list(root).map(
      (entry: { path: string }): string => entry.path,
    ),
    ["hero", "hero/arm", "hero/wire", "dots", "sprite"],
  );
}