import { modernScene } from "@automovie/website/modern-scene";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { IDENTITY_TRANSFORM } from "../internal/fixtures";
import { throwsError } from "../internal/predicates";
import { modernPayload } from "../internal/websiteTourFixture";

/**
 * The website draws the native physical light records rather than a new wash.
 * Scenarios:
 * 1. Point and directional lights preserve intensity, placement and shadow parameters.
 * 2. A null background remains transparent; absent/unsupported light rigs fail visibly.
 */
export const test_website_tour_modern_lighting = (): void => {
  const payload = modernPayload();
  const shadow = {
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
  const scene = modernScene(payload, new Map());
  const sun = scene.children.find(
    (o) => o instanceof THREE.DirectionalLight,
  ) as THREE.DirectionalLight;
  const lamps = scene.children.filter(
    (o) => o instanceof THREE.PointLight,
  ) as THREE.PointLight[];
  TestValidator.equals(
    "sun direction from source quaternion",
    [
      sun.position.toArray(),
      sun.target.position.toArray(),
      sun.intensity,
      sun.castShadow,
    ],
    [[3, 0, 47], [3, 0, -5], 3, true],
  );
  TestValidator.equals(
    "lamp source",
    [
      lamps[0]!.position.toArray(),
      lamps[0]!.intensity,
      lamps[0]!.distance,
      lamps[1]!.castShadow,
    ],
    [[4, 5, 6], 2, 8, false],
  );
  TestValidator.equals(
    "authored shadow settings",
    [
      sun.shadow.mapSize.toArray(),
      sun.shadow.bias,
      sun.shadow.normalBias,
      sun.shadow.camera.near,
      sun.shadow.camera.far,
    ],
    [[512, 512], -0.001, 0.01, 0.1, 100],
  );
  payload.physicalLighting!.environment.background = null;
  TestValidator.equals(
    "transparent background",
    modernScene(payload, new Map()).background,
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
    throwsError(() => modernScene(payload, new Map())),
  );
  delete payload.physicalLighting;
  TestValidator.predicate(
    "missing source rig",
    throwsError(() => modernScene(payload, new Map())),
  );
};
