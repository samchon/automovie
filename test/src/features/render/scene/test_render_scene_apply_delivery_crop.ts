import type { IAutoMovieDeliveryCrop } from "@automovie/interface";
import { AutoMovieRenderSceneDeliveryCrop } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/** Closed-form tolerance for projected normalized coordinates. */
const NDC_TOLERANCE: number = 1e-9;

/**
 * `AutoMovieRenderSceneDeliveryCrop.apply` installs a normalized window on a
 * perspective camera and `AutoMovieRenderSceneDeliveryCrop.read` recovers it.
 *
 * Scenarios:
 *
 * 1. Omission and the whole window leave no crop to read.
 * 2. A 90-degree, aspect-2 camera projects (0.5, 0.25, -2) to (0.125, 0.125)
 *    uncropped and to (0.25, 0.15625) through the window 0.25..0.75 by
 *    0.1..0.9, and that window reads back.
 * 3. A window starting at x 0.5 puts its left edge at NDC -1 and the right
 *    edge at +1.
 */
export function test_render_scene_apply_delivery_crop(): void {
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    90,
    2,
    1,
    10,
  );
  AutoMovieRenderSceneDeliveryCrop.apply(camera, undefined);
  TestValidator.equals(
    "omitted",
    AutoMovieRenderSceneDeliveryCrop.read(camera),
    undefined,
  );
  AutoMovieRenderSceneDeliveryCrop.apply(camera, {
    left: 0,
    top: 0,
    right: 1,
    bottom: 1,
  });
  TestValidator.equals(
    "whole",
    AutoMovieRenderSceneDeliveryCrop.read(camera),
    undefined,
  );

  const point: THREE.Vector3 = new THREE.Vector3(0.5, 0.25, -2);
  const whole: THREE.Vector3 = point.clone().project(camera);
  TestValidator.predicate(
    "uncropped projection",
    Math.abs(whole.x - 0.125) < NDC_TOLERANCE &&
      Math.abs(whole.y - 0.125) < NDC_TOLERANCE,
  );

  AutoMovieRenderSceneDeliveryCrop.apply(camera, {
    left: 0.25,
    top: 0.1,
    right: 0.75,
    bottom: 0.9,
  });
  const cropped: THREE.Vector3 = point.clone().project(camera);
  TestValidator.predicate(
    "cropped projection",
    Math.abs(cropped.x - 0.25) < NDC_TOLERANCE &&
      Math.abs(cropped.y - 0.15625) < NDC_TOLERANCE,
  );
  const read: IAutoMovieDeliveryCrop | undefined =
    AutoMovieRenderSceneDeliveryCrop.read(camera);
  TestValidator.predicate(
    "window reads back",
    read !== undefined &&
      Math.abs(read.left - 0.25) < NDC_TOLERANCE &&
      Math.abs(read.top - 0.1) < NDC_TOLERANCE &&
      Math.abs(read.right - 0.75) < NDC_TOLERANCE &&
      Math.abs(read.bottom - 0.9) < NDC_TOLERANCE,
  );

  AutoMovieRenderSceneDeliveryCrop.apply(camera, {
    left: 0.5,
    top: 0,
    right: 1,
    bottom: 1,
  });
  const left: number = new THREE.Vector3(0, 0, -2).project(camera).x;
  const right: number = new THREE.Vector3(4, 0, -2).project(camera).x;
  TestValidator.predicate(
    "closed edges reach the output edges",
    Math.abs(left + 1) < NDC_TOLERANCE && Math.abs(right - 1) < NDC_TOLERANCE,
  );
}
