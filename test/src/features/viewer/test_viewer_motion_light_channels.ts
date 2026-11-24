import type {
  IAutoMovieClip,
  IAutoMoviePointerChannel,
  IAutoMovieScene,
  IAutoMovieTrack,
} from "@automovie/interface";
import {
  AutoMovieThreeKind,
  applyLightMotion,
  buildScene,
} from "@automovie/render";
import { strict as assert } from "node:assert";
import * as THREE from "three";

import { IDENTITY_TRANSFORM } from "../internal/fixtures";

function cue(
  pointer: string,
  values: number[],
  type: IAutoMoviePointerChannel["valueType"],
  interpolation: IAutoMovieTrack["interpolation"],
): IAutoMovieTrack {
  return {
    channel: { kind: "pointer", pointer, valueType: type },
    times: [0, 2],
    values,
    interpolation,
  };
}

/**
 * 1. Stage two lights and check native lookup, order, range and authored baseline.
 * 2. Sample a midpoint and a STEP boundary, then reset only the resolved lights.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the native observations and the two clocks.
 * @evidence contracts/development/testing.md#behavioral-verification Applies pointer channels to actual Three lights, then removes their clips and one lookup.
 * @evidence contracts/development/testing.md#independent-expectations Authored RGB endpoints average componentwise, a 90-degree cone is π/2 radians, and a step holds its preceding key.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks staging, midpoint, exact final key, unresolved-light preservation and rest restoration.
 * @evidence contracts/development/testing.md#execution-ownership Direct CPU-side light application needs no renderer or clock loop.
 */
export function test_viewer_motion_light_channels(): void {
  const scene: IAutoMovieScene = {
    id: "studio",
    name: null,
    nodes: [],
    cameras: [],
    lights: [
      {
        id: "fill",
        type: "point",
        transform: IDENTITY_TRANSFORM,
        color: { r: 1, g: 0.5, b: 0, a: null, hex: null },
        intensity: 2,
        range: 4,
      },
      {
        id: "key",
        type: "spot",
        transform: IDENTITY_TRANSFORM,
        color: { r: 1, g: 1, b: 1, a: null, hex: null },
        intensity: 1,
        range: 4,
        coneAngle: 45,
      },
    ],
  };
  const built: ReturnType<typeof buildScene> = buildScene(
    scene,
    (): undefined => undefined,
  );
  const fill: THREE.Light | undefined = built.lights.get("fill");
  const key: THREE.Light | undefined = built.lights.get("key");
  assert.ok(
    fill !== undefined &&
      AutoMovieThreeKind.isPointLight(fill) &&
      key !== undefined &&
      AutoMovieThreeKind.isSpotLight(key),
  );
  assert.deepEqual(built.scene.children, [fill, key]);
  assert.deepEqual(
    [fill.intensity, fill.distance, ...fill.color.toArray(), key.angle],
    [2, 4, 1, 0.5, 0, Math.PI / 4],
  );
  const clip: IAutoMovieClip = {
    id: "cue",
    name: null,
    duration: 2,
    loop: false,
    tracks: [
      cue("/lights/fill/intensity", [2, 0], "scalar", "step"),
      cue("/lights/fill/color", [1, 0.5, 0, 0, 0.5, 1], "vec3", "linear"),
      cue("/lights/key/coneAngle", [45, 135], "scalar", "linear"),
    ],
  };
  function resolve(id: string): THREE.Light | undefined {
    return built.lights.get(id);
  }
  applyLightMotion(scene.lights, [clip], 1, resolve);
  assert.deepEqual(
    [fill.intensity, ...fill.color.toArray(), key.angle],
    [2, 0.5, 0.5, 0.5, Math.PI / 2],
  );
  applyLightMotion(scene.lights, [clip], 2, resolve);
  assert.equal(fill.intensity, 0);
  applyLightMotion(
    scene.lights,
    [],
    0,
    (id: string): THREE.Light | undefined => (id === "key" ? key : undefined),
  );
  assert.deepEqual([fill.intensity, key.angle], [0, Math.PI / 4]);
}
