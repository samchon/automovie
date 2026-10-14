import { TestValidator } from "@nestia/e2e";
import { buildScene } from "modern-suburban-house/viewer/scene";
import * as THREE from "three";

import { nclose, vclose } from "../internal/predicates";
import { modernPayload } from "../internal/websiteTourFixture";

/**
 * Extracting the shared native uploader preserves the inspector's calibration rig.
 * Scenarios:
 * 1. A calibration without physical lighting keeps its hemisphere and normalised key.
 * 2. Explicit shadow reach and target shift the same key.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the native modern producer with physical lighting omitted, observing fallback key placement, exposure, hemisphere presence and an explicitly shifted key target/reach; loss of calibration fallback or ignored authored target/extent fails. Mesh positions are not asserted here.
 * @evidence contracts/testing.md#independent-expectations The authored direction (0,1,1) normalizes to sqrt(1/2) components, and the declared fallback reach policy yields 20 meters; explicitly setting half extent 12 and target (3,4,5) yields 28-meter reach. These expectations concern native calibration policy, not general authored-light placement.
 * @evidence contracts/testing.md#distinguishing-cases Covers absent physical lighting, default reach and explicitly supplied target/extent; physical house lighting and its missing-source refusal belong to the website boundary unit, and native visual illumination is not observed.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_website_tour_calibration_lighting entry directly exercises experimental production code rather than a product package, an unresolved ownership mismatch under the test contract. It constructs CPU Three objects only and does not prove browser, renderer or GPU behavior.
 */
export function test_website_tour_calibration_lighting(): void {
  const payload: ReturnType<typeof modernPayload> = modernPayload();
  delete payload.physicalLighting;
  const renderer: Parameters<typeof buildScene>[2] = { toneMappingExposure: 0 };
  const scene: THREE.Scene = buildScene(
    payload,
    new Map<string, THREE.Texture>(),
    renderer,
  );
  const sun: THREE.DirectionalLight = scene.children.find(
    (o: THREE.Object3D): boolean => o instanceof THREE.DirectionalLight,
  ) as THREE.DirectionalLight;
  TestValidator.predicate(
    "calibration key distance",
    nclose(
      sun.position.distanceTo(
        new THREE.Vector3(0, Math.SQRT1_2 * 20, Math.SQRT1_2 * 20),
      ),
      0,
      1e-10,
    ) &&
      sun.position.distanceTo(
        new THREE.Vector3(0, Math.SQRT1_2 * 20, Math.SQRT1_2 * 20),
      ) < 1e-10,
  );
  TestValidator.predicate(
    "calibration exposure",
    nclose(renderer.toneMappingExposure, 1, 0),
  );
  TestValidator.predicate(
    "hemisphere retained",
    scene.children.some(
      (o: THREE.Object3D): boolean => o instanceof THREE.HemisphereLight,
    ),
  );
  payload.lighting.shadowHalfExtent = 12;
  payload.lighting.keyTarget = [3, 4, 5];
  const shifted: THREE.DirectionalLight = buildScene(
    payload,
    new Map<string, THREE.Texture>(),
    renderer,
  ).children.find(
    (o: THREE.Object3D): boolean => o instanceof THREE.DirectionalLight,
  ) as THREE.DirectionalLight;
  TestValidator.predicate(
    "native key target",
    vclose(shifted.target.position, { x: 3, y: 4, z: 5 }, 0),
  );
  TestValidator.predicate(
    "explicit extent normalises key",
    nclose(shifted.position.distanceTo(shifted.target.position), 28, 1e-10) &&
      Math.abs(shifted.position.distanceTo(shifted.target.position) - 28) <
        1e-10,
  );
}
