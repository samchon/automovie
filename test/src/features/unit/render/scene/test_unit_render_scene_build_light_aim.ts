import type {
  IAutoMovieDirectionalLight,
  IAutoMoviePointLight,
  IAutoMovieQuaternion,
  IAutoMovieSpotLight,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieThreeKind, buildLight } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import {
  type DirectionalLight,
  type Light,
  type SpotLight,
  Vector3,
} from "three";

import { nclose, vclose } from "../../../internal/predicates";

/** Eight arithmetic stages at magnitude at most four, including normalization. */
const AIM_TOLERANCE: number = 32 * Number.EPSILON;

/** Point placement and range are exact integer copies. */
const COPY_TOLERANCE: number = 0;

/** Read the world target-minus-light vector Three uses to aim. */
function shineDirection(
  light: DirectionalLight | SpotLight,
): IAutoMovieVector3 {
  light.updateMatrixWorld(true);
  const from: Vector3 = light.getWorldPosition(new Vector3());
  const to: Vector3 = light.target.getWorldPosition(new Vector3());
  return to.sub(from).normalize();
}

/** Normalize a hand-authored expected direction. */
function unit(direction: IAutoMovieVector3): IAutoMovieVector3 {
  const length: number = Math.hypot(direction.x, direction.y, direction.z);
  return {
    x: direction.x / length,
    y: direction.y / length,
    z: direction.z / length,
  };
}

/** A directional light's rotation in already-staged coordinates. */
function directional(
  rotation: IAutoMovieQuaternion,
): IAutoMovieDirectionalLight {
  return {
    id: "sun",
    type: "directional",
    transform: {
      translation: { x: 0, y: 0, z: 0 },
      rotation,
      scale: { x: 1, y: 1, z: 1 },
    },
    color: { r: 1, g: 1, b: 1, a: null, hex: null },
    intensity: 1,
  };
}

/**
 * Render light construction installs a target at its local negative Z axis for
 * aimed lights. Three's target-based direction follows staged rotation.
 *
 * Scenarios:
 *
 * 1. Rotations of -90 and +90 degrees about X aim at negative and positive Y. The
 *    shortest rotation from negative Z to a diagonal aims along that
 *    independently normalized direction.
 * 2. A translated spot aims along diagonal negative X and Y. Its target is a child
 *    of the light, so moving the source retains that direction.
 * 3. A point has no aiming target and preserves its position and range.
 */
export function test_unit_render_scene_build_light_aim(): void {
  const diagonal: IAutoMovieVector3 = unit({ x: -1, y: -2, z: 0.5 });
  const crossScale: number = Math.sqrt(2 * (1 - diagonal.z));
  const cases: [IAutoMovieQuaternion, IAutoMovieVector3][] = [
    [
      { x: -Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 },
      { x: 0, y: -1, z: 0 },
    ],
    [
      { x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 },
      { x: 0, y: 1, z: 0 },
    ],
    [
      {
        x: diagonal.y / crossScale,
        y: -diagonal.x / crossScale,
        z: 0,
        w: crossScale / 2,
      },
      diagonal,
    ],
  ];
  for (const [rotation, expected] of cases) {
    const light: Light = buildLight(directional(rotation));
    if (!AutoMovieThreeKind.isDirectionalLight(light))
      throw new Error("Expected a directional light");
    const shine: IAutoMovieVector3 = shineDirection(light);
    TestValidator.predicate(
      "native directional light target",
      vclose(shine, expected, AIM_TOLERANCE),
    );
    TestValidator.predicate(
      "native aiming vector has unit length",
      nclose(Math.hypot(shine.x, shine.y, shine.z), 1, AIM_TOLERANCE),
    );
  }

  const spotRotation: IAutoMovieQuaternion = {
    x: -0.5,
    y: 0.5,
    z: 0,
    w: Math.SQRT1_2,
  };
  const base: IAutoMovieDirectionalLight = directional(spotRotation);
  const spotSpec: IAutoMovieSpotLight = {
    ...base,
    id: "lamp",
    type: "spot",
    transform: { ...base.transform, translation: { x: 2, y: 3, z: 0 } },
    intensity: 5,
    range: 0,
    coneAngle: 30,
  };
  const spot: Light = buildLight(spotSpec);
  if (!AutoMovieThreeKind.isSpotLight(spot))
    throw new Error("Expected a spot light");
  TestValidator.predicate(
    "a translated spot aims along its staged rotation",
    spot.target.parent === spot &&
      vclose(
        shineDirection(spot),
        { x: -Math.SQRT1_2, y: -Math.SQRT1_2, z: 0 },
        AIM_TOLERANCE,
      ),
  );

  const pointSpec: IAutoMoviePointLight = {
    ...base,
    id: "candle",
    type: "point",
    transform: {
      ...base.transform,
      translation: { x: 1, y: 2, z: -1 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
    intensity: 3,
    range: 8,
  };
  const point: Light = buildLight(pointSpec);
  if (!AutoMovieThreeKind.isPointLight(point))
    throw new Error("Expected a point light");
  TestValidator.predicate(
    "a point keeps its placement and uses no target",
    point.children.length === 0 &&
      vclose(point.position, pointSpec.transform.translation, COPY_TOLERANCE) &&
      nclose(point.distance, 8, COPY_TOLERANCE),
  );
}
