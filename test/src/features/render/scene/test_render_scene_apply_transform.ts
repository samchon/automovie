import { AutoMovieRenderSceneMotion } from "@automovie/render";;
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `applyTransform` writes a transform's translation, rotation and scale onto an
 * object.
 *
 * Scenarios:
 *
 * 1. Applying (1, 2, 3), the half turn about Y and scale (2, 3, 4) sets the
 *    object's position, quaternion and scale to those values.
 */
export function test_render_scene_apply_transform(): void {
  const object: THREE.Object3D = new THREE.Object3D();
 AutoMovieRenderSceneMotion.applyTransform(object, {
    translation: { x: 1, y: 2, z: 3 },
    rotation: { x: 0, y: 1, z: 0, w: 0 },
    scale: { x: 2, y: 3, z: 4 },
  });
  TestValidator.equals("position", object.position.toArray(), [1, 2, 3]);
  TestValidator.equals("rotation", object.quaternion.toArray(), [0, 1, 0, 0]);
  TestValidator.equals("scale", object.scale.toArray(), [2, 3, 4]);
}