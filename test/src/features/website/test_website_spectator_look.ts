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
 */
export const test_website_spectator_look = (): void => {
  const camera = new THREE.PerspectiveCamera(45),
    target = new THREE.Vector3(0, 0, -10);
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
    lookSpectatorCamera(camera, target, 0, sign * 100000);
    const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, "YXZ");
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
  const projection = camera.projectionMatrix.clone();
  zoomSpectatorCamera(camera, Math.log(2) * 1000);
  TestValidator.predicate("lens doubled", nclose(camera.fov, 90));
  TestValidator.predicate(
    "projection updated",
    !camera.projectionMatrix.equals(projection),
  );
  zoomSpectatorCamera(camera, 100000);
  TestValidator.equals("wide clamp", camera.fov, 110);
  zoomSpectatorCamera(camera, -100000);
  TestValidator.equals("narrow clamp", camera.fov, 5);
  TestValidator.predicate(
    "eye remains fixed",
    vclose(camera.position, new THREE.Vector3()),
  );
};
