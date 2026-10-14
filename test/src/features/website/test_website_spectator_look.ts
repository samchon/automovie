import {
  lookSpectatorCamera,
  zoomSpectatorCamera,
} from "@automovie/website/spectator-camera";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose, vclose } from "../internal/predicates";

/**
 * Mouse look turns at a fixed sensitivity while lens zoom leaves the eye fixed.
 * Scenarios:
 * 1. Horizontal look rotates the current authored view rather than a stale pose.
 * 2. Opposite pitch extremes stop short of inversion and coincident aim recovers.
 * 3. Wheel zoom obeys its lens range and updates the projection without translation.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls pointer look and lens zoom directly, observing one-radian yaw, adoption of a newly authored orientation, bounded pitch, removed roll, recovered aim distance and changed projection; stale orientation, inverted pitch or translated eye fails.
 * @evidence contracts/testing.md#independent-expectations The declared 0.0025-radian sensitivity makes 400 pixels one radian, trigonometric direction fixes the expected target, and exponential scaling makes log(2) times 1000 double a 45-degree lens; bounds come from the public 89-degree pitch and 5/110-degree lens policy.
 * @evidence contracts/testing.md#distinguishing-cases Covers horizontal look after an authored pose change, both pitch extremes, coincident eye/aim, ordinary zoom and both lens clamps with unchanged eye position; event capture and frame translation have separate spectator units.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_website_spectator_look entry owns portable Three camera arithmetic and matrix observations without renderer allocation, DOM, browser or GPU; it makes no rendered-appearance claim.
 */
export function test_website_spectator_look(): void {
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(45),
    target: THREE.Vector3 = new THREE.Vector3(0, 0, -10);
  lookSpectatorCamera(camera, target, 400, 0);
  TestValidator.predicate(
    "one radian right",
    vclose(target, new THREE.Vector3(10 * Math.sin(1), 0, -10 * Math.cos(1))),
  );
  camera.rotation.set(0, Math.PI / 2, 0, "YXZ");
  lookSpectatorCamera(camera, target, -400, 0);
  TestValidator.predicate(
    "new authored yaw adopted",
    nclose(
      new THREE.Euler().setFromQuaternion(camera.quaternion, "YXZ").y,
      Math.PI / 2 + 1,
    ),
  );
  for (const sign of [1, -1]) {
    camera.rotation.set(0, 0, 0.4, "YXZ");
    lookSpectatorCamera(camera, target, 0, sign * 100000);
    const euler: THREE.Euler = new THREE.Euler().setFromQuaternion(camera.quaternion, "YXZ");
    TestValidator.predicate(
      "pitch bounded",
      nclose(euler.x, (-sign * 89 * Math.PI) / 180),
    );
    TestValidator.predicate("roll removed", nclose(euler.z, 0));
  }
  target.copy(camera.position);
  lookSpectatorCamera(camera, target, 0, 0);
  TestValidator.predicate(
    "degenerate aim recovered",
    nclose(target.distanceTo(camera.position), 0.001),
  );
  const projection: THREE.Matrix4 = camera.projectionMatrix.clone();
  zoomSpectatorCamera(camera, Math.log(2) * 1000);
  TestValidator.predicate("lens doubled", nclose(camera.fov, 90));
  TestValidator.predicate(
    "projection updated",
    !camera.projectionMatrix.equals(projection),
  );
  zoomSpectatorCamera(camera, 100000);
  TestValidator.predicate("wide clamp", nclose(camera.fov, 110, 0));
  zoomSpectatorCamera(camera, -100000);
  TestValidator.predicate("narrow clamp", nclose(camera.fov, 5, 0));
  TestValidator.predicate(
    "eye remains fixed",
    vclose(camera.position, new THREE.Vector3()),
  );
}
