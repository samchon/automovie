import { TestValidator } from "@nestia/e2e";
import { buildScene } from "modern-suburban-house/viewer/scene";
import * as THREE from "three";

import { modernPayload } from "../internal/websiteTourFixture";

/**
 * Extracting the shared native uploader preserves the inspector's calibration rig.
 * Scenarios:
 * 1. A calibration without physical lighting keeps its hemisphere and normalised key.
 * 2. Explicit shadow reach and target shift the same key without changing mesh positions.
 */
export const test_website_tour_calibration_lighting = (): void => {
  const payload = modernPayload();
  delete payload.physicalLighting;
  const renderer = { toneMappingExposure: 0 };
  const scene = buildScene(payload, new Map(), renderer);
  const sun = scene.children.find(
    (o) => o instanceof THREE.DirectionalLight,
  ) as THREE.DirectionalLight;
  TestValidator.predicate(
    "calibration key distance",
    sun.position.distanceTo(
      new THREE.Vector3(0, Math.SQRT1_2 * 20, Math.SQRT1_2 * 20),
    ) < 1e-10,
  );
  TestValidator.equals("calibration exposure", renderer.toneMappingExposure, 1);
  TestValidator.predicate(
    "hemisphere retained",
    scene.children.some((o) => o instanceof THREE.HemisphereLight),
  );
  payload.lighting.shadowHalfExtent = 12;
  payload.lighting.keyTarget = [3, 4, 5];
  const shifted = buildScene(payload, new Map(), renderer).children.find(
    (o) => o instanceof THREE.DirectionalLight,
  ) as THREE.DirectionalLight;
  TestValidator.equals(
    "native key target",
    shifted.target.position.toArray(),
    [3, 4, 5],
  );
  TestValidator.predicate(
    "explicit extent normalises key",
    Math.abs(shifted.position.distanceTo(shifted.target.position) - 28) < 1e-10,
  );
};
