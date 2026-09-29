import { applyTourView } from "@automovie/website/tour-camera";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { tourView } from "../internal/websiteTourFixture";

/**
 * Entering an authored view applies its exact world eye, aim and lens.
 * Scenarios:
 * 1. A native pose supplies all camera parameters without changing its record.
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
};
