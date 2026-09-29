import { moveSpectatorCamera } from "@automovie/website/spectator-camera";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose, vclose } from "../internal/predicates";

/**
 * Free flight translates eye and aim at the requested metre-per-second pace.
 * Scenarios:
 * 1. Forward travels 0.8 m per 100 ms normally and 0.2 m while Shift is held.
 * 2. Opposite and diagonal axes have independently calculated directions and normalized pace.
 * 3. Pitched forward follows the view; empty, negative and delayed time stay bounded.
 */
export const test_website_spectator_translation = (): void => {
  const camera = new THREE.PerspectiveCamera(),
    target = new THREE.Vector3(0, 0, -10);
  const axes = { forward: 1, right: 0, up: 0 };
  TestValidator.predicate(
    "fast movement",
    moveSpectatorCamera(camera, target, axes, 0.1, false),
  );
  TestValidator.predicate(
    "8 m/s",
    vclose(camera.position, new THREE.Vector3(0, 0, -0.8)),
  );
  moveSpectatorCamera(camera, target, axes, 0.1, true);
  TestValidator.predicate(
    "Shift is one quarter speed",
    vclose(camera.position, new THREE.Vector3(0, 0, -1)),
  );
  TestValidator.predicate(
    "aim translates with eye",
    vclose(target, new THREE.Vector3(0, 0, -11)),
  );
  for (const input of [
    { forward: -1, right: 0, up: 0 },
    { forward: 0, right: 1, up: 0 },
    { forward: 0, right: -1, up: 0 },
    { forward: 0, right: 0, up: 1 },
    { forward: 0, right: 0, up: -1 },
  ]) {
    camera.position.set(0, 0, 0);
    moveSpectatorCamera(camera, target, input, 0.1, false);
    TestValidator.predicate(
      "independent direction",
      vclose(
        camera.position,
        new THREE.Vector3(
          input.right * 0.8,
          input.up * 0.8,
          -input.forward * 0.8,
        ),
      ),
    );
  }
  camera.position.set(0, 0, 0);
  moveSpectatorCamera(
    camera,
    target,
    { forward: 1, right: 1, up: 0 },
    0.1,
    false,
  );
  TestValidator.predicate(
    "diagonal normalized",
    vclose(
      camera.position,
      new THREE.Vector3(0.8 / Math.SQRT2, 0, -0.8 / Math.SQRT2),
    ),
  );
  camera.position.set(0, 0, 0);
  camera.rotation.x = Math.PI / 6;
  moveSpectatorCamera(camera, target, axes, 10, false);
  TestValidator.predicate(
    "pitch and pause clamp",
    vclose(camera.position, new THREE.Vector3(0, 0.4, -0.4 * Math.sqrt(3))),
  );
  TestValidator.predicate(
    "empty input stays still",
    !moveSpectatorCamera(
      camera,
      target,
      { forward: 0, right: 0, up: 0 },
      0.1,
      false,
    ),
  );
  TestValidator.predicate(
    "zero time stays still",
    !moveSpectatorCamera(camera, target, axes, 0, false),
  );
  TestValidator.predicate(
    "backward clock stays still",
    !moveSpectatorCamera(camera, target, axes, -1, false),
  );
  TestValidator.predicate(
    "bounded movement",
    nclose(camera.position.length(), 0.8),
  );
};
