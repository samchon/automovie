import { modernScene } from "@automovie/website/modern-scene";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { IDENTITY_TRANSFORM } from "../internal/fixtures";
import { throwsError } from "../internal/predicates";
import { modernPayload } from "../internal/websiteTourFixture";
import { test12ValuesClose } from "../internal/test12ValuesClose";

/**
 * The website draws the native physical light records rather than a new wash.
 * Scenarios:
 * 1. Lights preserve intensity and shadow parameters; point placement is authored and directional placement follows the current fixed preview policy.
 * 2. A null background remains transparent; absent/unsupported light rigs fail visibly.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the website modern-scene boundary and observes native directional/point light fields, authored shadow values, transparent background and explicit unsupported/missing-lighting refusal; omitted source intensity, point placement or shadow parameters fail.
 * @evidence contracts/testing.md#independent-expectations Authored point translation/intensity/range and shadow literals independently determine their expected copies. The directional target (3,0,-5) and 52-meter reach are currently copied from native implementation policy rather than derived from this payload; that oracle gap remains unresolved and this unit does not prove authored directional placement.
 * @evidence contracts/testing.md#distinguishing-cases Covers directional, shadowed point and unshadowed point sources, null background, unsupported spot and absent physical lighting; calibration fallback belongs to a separate native-producer case, and arbitrary rotations/placements are not asserted here.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_website_tour_modern_lighting entry owns CPU scene/light projection through the website boundary, without renderer, browser, fetch or GPU; fixed numeric records use the existing zero-tolerance nclose structural predicate and do not certify rendered lighting.
 */
export function test_website_tour_modern_lighting(): void {
  const payload: ReturnType<typeof modernPayload> = modernPayload();
  const shadow: import("@automovie/interface").IAutoMovieLightShadow = {
    mapSize: 512,
    bias: -0.001,
    normalBias: 0.01,
    near: 0.1,
    far: 100,
  };
  payload.physicalLighting!.lights = [
    {
      id: "sun",
      type: "directional",
      transform: IDENTITY_TRANSFORM,
      color: { r: 1, g: 0.8, b: 0.6, a: null, hex: null },
      intensity: 3,
      castShadow: true,
      shadow,
    },
    {
      id: "lamp",
      type: "point",
      transform: { ...IDENTITY_TRANSFORM, translation: { x: 4, y: 5, z: 6 } },
      color: { r: 1, g: 1, b: 1, a: null, hex: null },
      intensity: 2,
      range: 8,
      shadow,
    },
    {
      id: "unshadowed",
      type: "point",
      transform: IDENTITY_TRANSFORM,
      color: { r: 1, g: 1, b: 1, a: null, hex: null },
      intensity: 1,
      range: 0,
    },
  ];
  const scene: THREE.Scene = modernScene(payload, new Map<string, THREE.Texture>());
  const sun: THREE.DirectionalLight = scene.children.find(
    (o: THREE.Object3D): boolean => o instanceof THREE.DirectionalLight,
  ) as THREE.DirectionalLight;
  const lamps: THREE.PointLight[] = scene.children.filter(
    (o: THREE.Object3D): boolean => o instanceof THREE.PointLight,
  ) as THREE.PointLight[];
  TestValidator.predicate(
    "sun direction from source quaternion",
    test12ValuesClose([
      sun.position.toArray(),
      sun.target.position.toArray(),
      sun.intensity,
      sun.castShadow,
    ],
    [[3, 0, 47], [3, 0, -5], 3, true]),
  );
  TestValidator.predicate(
    "lamp source",
    test12ValuesClose([
      lamps[0]!.position.toArray(),
      lamps[0]!.intensity,
      lamps[0]!.distance,
      lamps[1]!.castShadow,
    ],
    [[4, 5, 6], 2, 8, false]),
  );
  TestValidator.predicate(
    "authored shadow settings",
    test12ValuesClose([
      sun.shadow.mapSize.toArray(),
      sun.shadow.bias,
      sun.shadow.normalBias,
      sun.shadow.camera.near,
      sun.shadow.camera.far,
    ],
    [[512, 512], -0.001, 0.01, 0.1, 100]),
  );
  payload.physicalLighting!.environment.background = null;
  TestValidator.equals(
    "transparent background",
    modernScene(payload, new Map<string, THREE.Texture>()).background,
    null,
  );
  payload.physicalLighting!.lights = [
    {
      ...payload.physicalLighting!.lights[0]!,
      type: "spot",
      range: 5,
      coneAngle: 30,
    },
  ];
  TestValidator.predicate(
    "unsupported source stays explicit",
    throwsError((): THREE.Scene => modernScene(payload, new Map<string, THREE.Texture>()), "unsupported house light sun"),
  );
  delete payload.physicalLighting;
  TestValidator.predicate(
    "missing source rig",
    throwsError((): THREE.Scene => modernScene(payload, new Map<string, THREE.Texture>()), "The modern house is missing its authored lighting"),
  );
}
