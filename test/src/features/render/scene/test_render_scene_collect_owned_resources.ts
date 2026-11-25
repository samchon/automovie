import { collectAutoMovieOwnedResources } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `collectAutoMovieOwnedResources` lists what a subtree must dispose.
 *
 * Scenarios:
 *
 * 1. Two meshes sharing one geometry and one material list the geometry and the
 *    material once; objects that are not meshes add nothing.
 * 2. A mesh's custom depth material is listed too.
 * 3. Textures a material holds are listed only when the caller owns textures.
 */
export function test_render_scene_collect_owned_resources(): void {
  const geometry: THREE.BoxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const map: THREE.Texture = new THREE.Texture();
  const material: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({ map });
  const depth: THREE.MeshDepthMaterial = new THREE.MeshDepthMaterial();
  const first: THREE.Mesh = new THREE.Mesh(geometry, material);
  first.customDepthMaterial = depth;
  const second: THREE.Mesh = new THREE.Mesh(geometry, material);
  const root: THREE.Group = new THREE.Group();
  root.add(first, second, new THREE.Group());

  const borrowed = collectAutoMovieOwnedResources(root);
  TestValidator.predicate(
    "shared once",
    borrowed.length === 3 &&
      borrowed.includes(geometry) &&
      borrowed.includes(material) &&
      borrowed.includes(depth),
  );
  const owned = collectAutoMovieOwnedResources(root, true);
  TestValidator.predicate(
    "textures",
    owned.length === 4 && owned.includes(map),
  );
}