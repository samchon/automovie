import type { IAutoMovieClip, IAutoMovieLight } from "@automovie/interface";
import { applyLightMotion, buildLight } from "@automovie/render";
import { strict as assert } from "node:assert";
import * as THREE from "three";

import { IDENTITY_TRANSFORM } from "../internal/fixtures";

/**
 * 1. Inspect the staged spotlight's origin and target in world space.
 * 2. Translate the light while turning it a quarter turn, checking origin and ray independently.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the native origin and direction observed at three times.
 * @evidence contracts/development/testing.md#behavioral-verification Applies real light motion, reads the native target and subtracts the native light position.
 * @evidence contracts/development/testing.md#independent-expectations Turning local minus Z through angle a about Y gives (-sin(a),0,-cos(a)); translation interpolates along X.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers rest and animated endpoints as well as the diagonal midpoint at a nonzero origin.
 * @evidence contracts/development/testing.md#execution-ownership The native spotlight has no scene renderer or GPU dependencies.
 */
export function test_viewer_motion_light_target(): void {
  const spec: IAutoMovieLight = {
    id: "lamp",
    type: "spot",
    color: { r: 1, g: 1, b: 1, a: null, hex: null },
    intensity: 1,
    range: 4,
    coneAngle: 45,
    transform: { ...IDENTITY_TRANSFORM, translation: { x: 2, y: 4, z: 0 } },
  };
  const native: THREE.Light = buildLight(spec);
  assert.ok(native instanceof THREE.SpotLight);
  const clip: IAutoMovieClip = {
    id: "turn",
    name: null,
    duration: 2,
    loop: false,
    tracks: [
      {
        channel: {
          kind: "pointer",
          pointer: "/lights/lamp/rotation",
          valueType: "quaternion",
        },
        times: [0, 2],
        values: [0, 0, 0, 1, 0, Math.SQRT1_2, 0, Math.SQRT1_2],
        interpolation: "linear",
      },
      {
        channel: {
          kind: "pointer",
          pointer: "/lights/lamp/position",
          valueType: "vec3",
        },
        times: [0, 2],
        values: [2, 4, 0, 4, 4, 0],
        interpolation: "linear",
      },
    ],
  };
  function observe(spot: THREE.SpotLight, t: number): void {
    spot.updateMatrixWorld(true);
    const origin: THREE.Vector3 = spot.getWorldPosition(new THREE.Vector3());
    const ray: THREE.Vector3 = spot.target
      .getWorldPosition(new THREE.Vector3())
      .sub(origin)
      .normalize();
    const angle: number = (Math.PI * t) / 4;
    assert.deepEqual(origin.toArray(), [2 + t, 4, 0]);
    assert.ok(
      ray.distanceTo(new THREE.Vector3(-Math.sin(angle), 0, -Math.cos(angle))) <
        1e-9,
    );
  }
  observe(native, 0);
  for (const t of [0, 1, 2]) {
    applyLightMotion([spec], [clip], t, (): THREE.Light => native);
    observe(native, t);
  }
}
