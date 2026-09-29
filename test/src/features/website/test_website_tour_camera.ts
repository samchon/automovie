import { applyTourView, moveTourCamera } from "@automovie/website/tour-camera";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { tourView } from "../internal/websiteTourFixture";

/**
 * Camera controls change only the eye and aim, using independent orbit geometry.
 * Scenarios:
 * 1. An authored pose applies its exact lens and target.
 * 2. Opposite orbit/pan directions preserve radius or eye-target displacement.
 * 3. Zoom clamps at clip bounds and recovers a coincident eye/target.
 */
export const test_website_tour_camera = (): void => {
  const camera = new THREE.PerspectiveCamera(),
    target = new THREE.Vector3();
  applyTourView(camera, target, tourView());
  TestValidator.equals(
    "authored pose",
    [
      camera.position.toArray(),
      target.toArray(),
      camera.fov,
      camera.near,
      camera.far,
    ],
    [[0, 2, 10], [0, 2, 0], 45, 0.1, 100],
  );
  for (const action of ["left", "right", "up", "down"] as const) {
    applyTourView(camera, target, tourView());
    moveTourCamera(camera, target, action);
    TestValidator.predicate(
      "orbit keeps radius",
      Math.abs(camera.position.distanceTo(target) - 10) < 1e-9,
    );
    TestValidator.predicate(
      "direction moves eye",
      action === "left"
        ? camera.position.x < 0
        : action === "right"
          ? camera.position.x > 0
          : action === "up"
            ? camera.position.y > 2
            : camera.position.y < 2,
    );
    applyTourView(camera, target, tourView());
    const difference = camera.position.clone().sub(target);
    moveTourCamera(camera, target, action, true);
    TestValidator.predicate(
      "pan keeps aim distance",
      camera.position.clone().sub(target).distanceTo(difference) < 1e-9,
    );
  }
  applyTourView(camera, target, tourView());
  moveTourCamera(camera, target, "in");
  TestValidator.predicate(
    "zoom in scales radius",
    Math.abs(camera.position.distanceTo(target) - 8.5) < 1e-9,
  );
  moveTourCamera(camera, target, "out");
  TestValidator.predicate(
    "zoom out scales radius",
    Math.abs(camera.position.distanceTo(target) - 10.03) < 1e-9,
  );
  camera.position.copy(target);
  moveTourCamera(camera, target, "in");
  TestValidator.predicate(
    "coincident eye recovers",
    Math.abs(camera.position.distanceTo(target) - 0.2) < 1e-9,
  );
  camera.position.copy(target).add(new THREE.Vector3(0, 0, 1000));
  moveTourCamera(camera, target, "out");
  TestValidator.predicate(
    "far clamp",
    Math.abs(camera.position.distanceTo(target) - 80) < 1e-9,
  );
};
