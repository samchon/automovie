import { IAutoMovieClip, IAutoMovieScene } from "@automovie/interface";
import { applyLightMotion, buildScene } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { IDENTITY_TRANSFORM } from "../internal/fixtures";
import { namedFacts, nclose } from "../internal/predicates";

const scene: IAutoMovieScene = {
  id: "scene-1",
  name: null,
  nodes: [],
  cameras: [],
  lights: [
    {
      id: "candleGlow",
      type: "point",
      transform: IDENTITY_TRANSFORM,
      color: { r: 1, g: 0.8, b: 0.5, a: null, hex: null },
      intensity: 1.4,
      range: 4,
    },
    {
      id: "lamp",
      type: "spot",
      transform: IDENTITY_TRANSFORM,
      color: { r: 1, g: 1, b: 1, a: null, hex: null },
      intensity: 2,
      range: 10,
      coneAngle: 40,
    },
  ],
  space: null,
};

/** A one-track light clip on the beat's three-second clock. */
const clip: (id: string, pointer: string, valueType: "scalar" | "vec3", times: number[], values: number[], interpolation: "step" | "linear") => IAutoMovieClip = (
  id: string,
  pointer: string,
  valueType: "scalar" | "vec3",
  times: number[],
  values: number[],
  interpolation: "step" | "linear",
): IAutoMovieClip => ({
  id,
  name: null,
  duration: 3,
  loop: false,
  tracks: [
    {
      channel: { kind: "pointer", pointer, valueType },
      times,
      values,
      interpolation,
    },
  ],
});

/**
 * A shot's `lightMotions` reaches the native lights indexed by `buildScene` through `applyLightMotion`.
 *
 * The earlier validated artifact lacked an applier. These cases observe the downstream property writes on the published light identities.
 *
 * Authored `range` maps to native distance in metres, and the half-angle `coneAngle` maps from degrees to radians, so 40° gives `40π/180`. The glTF STEP rule selects the cue value, while midpoint linear interpolation over [1.2,2.0] defines colour and cone expectations.
 *
 * Scenarios:
 *
 * 1. `buildScene` publishes its lights by ID and still adds them as top-level
 *    children in staging order; the mask palette is keyed by that index, so
 *    the id map has to be an addition rather than a reordering.
 * 2. A staged light lands with its authored values (the point light's colour,
 *    intensity, and `distance`; the spot's cone in radians), which is what
 *    makes the "before" of the next scenario an observed metadata value and not an
 *    assumption.
 * 3. At `t = 1.6` the candle reads 0.04 and the segment midpoint colour `(0.5,
 *    0.4, 0.25)`, and the lamp's cone has opened to 70°: the clips drove the
 *    `three.js` lights, on the ids they named.
 * 4. Two halves of one call. A light the host does not resolve is skipped, not
 *    thrown at (the engine already refused a clip naming an unstaged light, so
 *    an unresolved one here is a host that built part of the scene). A light no
 *    clip addresses is written back to its staged value, which is where this
 *    helper deliberately differs from `applyObjectMotion`: a light carries its
 *    own rest on the scene, so the viewer's lighting can be a pure function of
 *    scene, clips and time instead of depending on what the previous frame left
 *    behind.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds actual native lights and applies authored light clips through the published ID map. It observes staged native properties, step intensity and interpolated color/cone values, plus unresolved-light skipping and staged reset for an unanimated light.
 * @evidence contracts/testing.md#independent-expectations Authored channel samples supply STEP value 0.04 at its 1.6-second key and midpoint linear color (0.5,0.4,0.25) and cone 70 degrees. The half-angle degree-to-radian conversion and staged metadata define expected native values independently of the sampling output; emitted pixels and radiometric illumination are unmeasured.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts initial staged values, sampled STEP/linear changes, an unresolved animated candle retaining prior state and an unanimated resolved lamp returning to its declared cone. Pointer admission/interpolation endpoints belong to engine clip tests; this unit owns the native application seam and ID/order preservation.
 * @evidence contracts/testing.md#execution-ownership This named portable unit directly invokes scene construction and light application on Three objects using supplied ID lookup callbacks. It acquires no renderer, browser, GPU or dynamic case registry; namedFacts executes the local assertions only.
 */
export function test_viewer_apply_light_motion(): void {
  const built: ReturnType<typeof buildScene> = buildScene(scene, (): undefined => undefined);

  // 1. published by id, still ordered by staging.
  TestValidator.equals(
    "the light index is keyed by id, and the children keep staging order",
    [[...built.lights.keys()], built.scene.children.map((child: THREE.Object3D): string => child.type)],
    [
      ["candleGlow", "lamp"],
      ["PointLight", "SpotLight"],
    ],
  );

  // 2. the staged values, the baseline the animation is measured against.
  const candle: THREE.PointLight = built.lights.get("candleGlow") as THREE.PointLight;
  const lamp: THREE.SpotLight = built.lights.get("lamp") as THREE.SpotLight;
  TestValidator.equals(
    "a staged light lands with its authored colour, intensity, range and cone",
    namedFacts([
      ["ncloseCandleColor", (): boolean => nclose(candle.color.r, 1)],
      ["ncloseCandleColor2", (): boolean => nclose(candle.color.g, 0.8)],
      ["ncloseCandleColor3", (): boolean => nclose(candle.color.b, 0.5)],
      ["ncloseCandleIntensity", (): boolean => nclose(candle.intensity, 1.4)],
      ["ncloseCandleDistance", (): boolean => nclose(candle.distance, 4)],
      ["ncloseLampAngle", (): boolean => nclose(lamp.angle, (40 * Math.PI) / 180)],
    ]),
    {
      ncloseCandleColor: true,
      ncloseCandleColor2: true,
      ncloseCandleColor3: true,
      ncloseCandleIntensity: true,
      ncloseCandleDistance: true,
      ncloseLampAngle: true,
    },
  );

  // 3. the clip drives them.
  applyLightMotion(
    scene.lights,
    [
      clip(
        "candleOut",
        "/lights/candleGlow/intensity",
        "scalar",
        [0, 1.55, 1.6, 3],
        [1.4, 1.4, 0.04, 0.04],
        "step",
      ),
      clip(
        "candleCools",
        "/lights/candleGlow/color",
        "vec3",
        [1.2, 2],
        [1, 0.8, 0.5, 0, 0, 0],
        "linear",
      ),
      clip(
        "lampOpens",
        "/lights/lamp/coneAngle",
        "scalar",
        [1.2, 2],
        [40, 100],
        "linear",
      ),
    ],
    1.6,
    (id: string): THREE.Light | undefined => built.lights.get(id),
  );
  TestValidator.equals(
    "the candle dims at the cue and the lamp's cone opens, in three.js units",
    namedFacts([
      ["ncloseCandleIntensity", (): boolean => nclose(candle.intensity, 0.04)],
      ["ncloseCandleColor", (): boolean => nclose(candle.color.r, 0.5)],
      ["ncloseCandleColor2", (): boolean => nclose(candle.color.g, 0.4)],
      ["ncloseCandleColor3", (): boolean => nclose(candle.color.b, 0.25)],
      ["ncloseLampAngle", (): boolean => nclose(lamp.angle, (70 * Math.PI) / 180)],
    ]),
    {
      ncloseCandleIntensity: true,
      ncloseCandleColor: true,
      ncloseCandleColor2: true,
      ncloseCandleColor3: true,
      ncloseLampAngle: true,
    },
  );

  // 4. an unresolved light is skipped, not thrown at.
  applyLightMotion(
    scene.lights,
    [
      clip(
        "candleRelight",
        "/lights/candleGlow/intensity",
        "scalar",
        [0, 3],
        [2.5, 2.5],
        "step",
      ),
    ],
    1.6,
    (id: string): THREE.Light | undefined => (id === "candleGlow" ? undefined : built.lights.get(id)),
  );
  TestValidator.equals(
    "the unresolved light is skipped, and the un-animated one returns to staged",
    namedFacts([
      ["ncloseCandleIntensity", (): boolean => nclose(candle.intensity, 0.04)],
      ["ncloseLampAngle", (): boolean => nclose(lamp.angle, (40 * Math.PI) / 180)],
    ]),
    { ncloseCandleIntensity: true, ncloseLampAngle: true },
  );
}
