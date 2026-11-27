import { AutoMovieRenderSceneMotion } from "@automovie/render";
import {
  objectTransform
} from "../../../../../packages/render/src/scene/internal/objectTransform";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `objectTransform` reads an object's transform as plain, detached numbers.
 *
 * Scenarios:
 *
 * 1. An object given a translation, rotation and scale reads back the same
 *    record, and moving the object afterwards leaves the record unchanged.
 */
export function test_render_scene_object_transform(): void {
  const transform: {
    translation: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number; w: number };
    scale: { x: number; y: number; z: number };
  } = {
    translation: { x: 1, y: 2, z: 3 },
    rotation: { x: 0, y: 1, z: 0, w: 0 },
    scale: { x: 2, y: 3, z: 4 },
  };
  const object: THREE.Object3D = new THREE.Object3D();
  AutoMovieRenderSceneMotion.applyTransform(object, transform);
  const read: ReturnType<typeof objectTransform> = objectTransform(object);
  TestValidator.equals("round trip", read, transform);
  object.position.x = 9;
  TestValidator.equals("detached", read.translation.x, 1);
}