import { AutoMovieRenderSpaceGroupName, AutoMovieRenderSceneShadow } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `applyShadowParticipation` decides which meshes cast and receive
 * shadows.
 *
 * Scenarios:
 *
 * 1. A mesh under the space group neither casts nor receives.
 * 2. An opaque mesh casts and receives.
 * 3. A blended mesh receives but does not cast.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the different cast and receive flags of space, opaque and blended meshes.
 * @evidence contracts/development/testing.md#behavioral-verification Applies the public shadow policy to one in-memory scene containing all three native mesh classifications and reads their actual flags.
 * @evidence contracts/development/testing.md#independent-expectations The space branch stays excluded. The opaque mesh casts and receives. The blended mesh receives without casting. Distinct fixture classes expose policy that uses a single flag for all meshes.
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
  space.name = AutoMovieRenderSpaceGroupName;
  space.add(ground);
  const root: THREE.Group = new THREE.Group();
  root.add(space, solid, glass);
  AutoMovieRenderSceneShadow.applyParticipation(root);
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