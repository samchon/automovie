import { applyTourView } from "@automovie/website/tour-camera";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose, vclose } from "../internal/predicates";
import { tourView } from "../internal/websiteTourFixture";

/**
 * Entering an authored view applies its exact world eye, aim and lens.
 * Scenarios:
 * 1. A native pose supplies the camera eye, target and perspective lens parameters.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls applyTourView and observes world eye, target and all three lens fields; copying an orbit offset or omitting a lens field fails. This unit does not inspect source mutation, orientation or GPU projection output.
 * @evidence contracts/testing.md#independent-expectations The independently authored tourView fixture supplies eye (0,2,10), target (0,2,0), a 45-degree lens and 0.1/100-meter clip distances; zero-tolerance scalar/vector predicates retain the former exact numeric expectations.
 * @evidence contracts/testing.md#distinguishing-cases Covers application of one non-origin eye and target with unequal clip distances; view navigation, spectator movement and lens clamps have separate units, and malformed authored camera admission is outside this mutation test.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_website_tour_camera entry calls the portable camera mutator with resident Three objects and no DOM, renderer, browser or GPU.
 */
export function test_website_tour_camera(): void {
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(),
    target: THREE.Vector3 = new THREE.Vector3();
  applyTourView(camera, target, tourView());
  TestValidator.predicate(
    "authored pose",
    vclose(camera.position, { x: 0, y: 2, z: 10 }, 0) &&
      vclose(target, { x: 0, y: 2, z: 0 }, 0) &&
      nclose(camera.fov, 45, 0) &&
      nclose(camera.near, 0.1, 0) &&
      nclose(camera.far, 100, 0),
  );
}
