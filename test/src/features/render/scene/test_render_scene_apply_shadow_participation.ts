import {
  SPACE_GROUP_NAME,
  applyAutoMovieShadowParticipation,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `applyAutoMovieShadowParticipation` decides which meshes cast and receive
 * shadows.
 *
 * Scenarios:
 *
 * 1. A mesh under the space group neither casts nor receives.
 * 2. An opaque mesh casts and receives.
 * 3. A blended mesh receives but does not cast.
 */
export function test_render_scene_apply_shadow_participation(): void {
  const mesh = (transparent: boolean): THREE.Mesh =>
    new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ transparent }),
    );
  const ground: THREE.Mesh = mesh(false);
  const solid: THREE.Mesh = mesh(false);
  const glass: THREE.Mesh = mesh(true);
  const space: THREE.Group = new THREE.Group();
  space.name = SPACE_GROUP_NAME;
  space.add(ground);
  const root: THREE.Group = new THREE.Group();
  root.add(space, solid, glass);
  applyAutoMovieShadowParticipation(root);
  TestValidator.equals(
    "participation",
    [ground, solid, glass].map((object: THREE.Mesh): boolean[] => [
      object.castShadow,
      object.receiveShadow,
    ]),
    [
      [false, false],
      [true, true],
      [false, true],
    ],
  );
}