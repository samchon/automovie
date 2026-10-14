import {
  AutoMovieChannelValueType,
  IAutoMovieChannel,
  IAutoMovieClip,
  IAutoMovieLight,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { Quaternion, resolveShotLighting } from "@automovie/engine";

import { IDENTITY_TRANSFORM } from "../internal/IDENTITY_TRANSFORM";
import { namedFacts } from "../internal/namedFacts";
import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";
import { vclose } from "../internal/vclose";

/**
 * An offset lamp with nonidentity rotation and nonuniform scale distinguishes retained staged fields from accidental identity defaults.
 *
 */
const lamp: IAutoMovieLight = {
  id: "lamp",
  type: "spot",
  transform: {
    translation: { x: 2, y: 4, z: 0 },
    rotation: { x: 0, y: 1, z: 0, w: 0 },
    scale: { x: 1.5, y: 0.5, z: 2 },
  },
  color: { r: 1, g: 1, b: 1, a: null, hex: null },
  intensity: 2,
  range: 10,
  coneAngle: 40,
};

const sun: IAutoMovieLight = {
  id: "sun",
  type: "directional",
  transform: IDENTITY_TRANSFORM,
  color: { r: 1, g: 1, b: 1, a: null, hex: null },
  intensity: 3,
};

const bulb: IAutoMovieLight = {
  id: "bulb",
  type: "point",
  transform: IDENTITY_TRANSFORM,
  color: { r: 1, g: 1, b: 1, a: null, hex: null },
  intensity: 1,
  range: 5,
};

const LIGHTS: IAutoMovieLight[] = [lamp, sun, bulb];

const pointer: (
  target: string,
  valueType: AutoMovieChannelValueType,
) => IAutoMovieChannel = (
  target: string,
  valueType: AutoMovieChannelValueType,
): IAutoMovieChannel => ({ kind: "pointer", pointer: target, valueType });

/** A one-track light clip on a four-second beat. */
const clip: (
  id: string,
  channel: IAutoMovieChannel,
  times: number[],
  values: number[],
  interpolation?: "step" | "linear",
) => IAutoMovieClip = (
  id: string,
  channel: IAutoMovieChannel,
  times: number[],
  values: number[],
  interpolation: "step" | "linear" = "linear",
): IAutoMovieClip => ({
  id,
  name: null,
  duration: 4,
  loop: false,
  tracks: [{ channel, times, values, interpolation }],
});

/** A quaternion as the flat `[x, y, z, w]` a keyframe stores. */
const keyed: (q: IAutoMovieQuaternion) => number[] = (
  q: IAutoMovieQuaternion,
): number[] => [q.x, q.y, q.z, q.w];

/** Rotation of `deg` about world Y, the axis a light swings across a sky on. */
const aboutY: (deg: number) => IAutoMovieQuaternion = (
  deg: number,
): IAutoMovieQuaternion => Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, deg);

/** The direction a light shines: its local −Z, carried by its rotation. */
const directionOf: (light: IAutoMovieLight) => IAutoMovieVector3 = (
  light: IAutoMovieLight,
): IAutoMovieVector3 =>
  Quaternion.rotateVector(light.transform.rotation, { x: 0, y: 0, z: -1 });

/** Angle in degrees between two unit vectors. */
const angleBetween: (a: IAutoMovieVector3, b: IAutoMovieVector3) => number = (
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
): number => {
  const dot: number = a.x * b.x + a.y * b.y + a.z * b.z;
  return (Math.acos(Math.min(1, Math.max(-1, dot))) * 180) / Math.PI;
};

/** One light of a resolved set, by id. */
const lightOf: (lights: IAutoMovieLight[], id: string) => IAutoMovieLight = (
  lights: IAutoMovieLight[],
  id: string,
): IAutoMovieLight =>
  lights.find((light: IAutoMovieLight): boolean => light.id === id)!;

/** The lamp resolved at `seconds` under `clips`. */
const lampAt: (clips: IAutoMovieClip[], seconds: number) => IAutoMovieLight = (
  clips: IAutoMovieClip[],
  seconds: number,
): IAutoMovieLight =>
  lightOf(resolveShotLighting({ lights: LIGHTS, clips, seconds }), "lamp");

/** A lamp turning a quarter turn about Y across the beat. */
const SWING: IAutoMovieClip = clip(
  "lampSwings",
  pointer("/lights/lamp/rotation", "quaternion"),
  [0, 4],
  [...keyed(aboutY(0)), ...keyed(aboutY(90))],
);

/**
 * Light position and rotation tracks change placement while retaining unaddressed staged values.
 *
 * Existing placement/value tracks accumulate on one light through the shot-lighting pass, and property-kind mismatches must reject.
 *
 * A positive quarter-turn about Y carries local negative Z to negative X, with midpoint direction (-sin45,0,-cos45). Endpoints and the symmetric midpoint also match normalized lerp, so these checks do not independently establish constant angular speed.
 *
 * Scenarios:
 *
 * 1. The declared amount, at two times. A lamp keyed from 0° to 90° about Y faces
 *    `(0, 0, -1)` at the start and `(-1, 0, 0)` at the end — 90° apart, the
 *    amount declared — and passes through exactly 45° at the midpoint.
 * 2. Position travels, and everything the track did not address is left alone: the
 *    lamp keeps the scale it was staged with (a punctual light has no extent,
 *    so scale is deliberately not an axis) and keeps its staged rotation, while
 *    a light whose intensity alone is keyed keeps its staged transform BY
 *    IDENTITY, so nothing downstream can read a re-boxed copy as a move.
 * 3. Position and rotation accumulate onto one light together with the older axes,
 *    since they are entries in the same table and not a second pass.
 * 4. The kind split, refused loudly in both directions: a directional light is
 *    infinitely distant and carries no `position`, a point light radiates every
 *    way and carries no `rotation`. Each throws rather than resolving to
 *    something plausible.
 *
 * @evidence contracts/testing.md#behavioral-verification Resolves authored position/rotation tracks and observes transform values, orientation, retained scale/reference ownership and property-kind refusals through the real shot-lighting pass.
 * @evidence contracts/testing.md#independent-expectations Linear endpoint arithmetic determines translated positions and sine/cosine of the authored half-angle determines the rotation midpoint; a symmetric midpoint also matches normalized lerp, so this case alone does not distinguish constant speed over the entire arc.
 * @evidence contracts/testing.md#distinguishing-cases Existing spot movement/rotation, unchanged transforms, valid/invalid light kinds and non-transform dimming contrast animated fields with preserved staged fields; general interpolation modes and key admission have separate owners.
 * @evidence contracts/testing.md#execution-ownership The named test_resolve_light_transform_channel entry directly executes synchronous CPU light-transform semantics on existing records, without a viewer, GPU or pixel-illumination assertion.
 */
export function test_resolve_light_transform_channel(): void {
  // 1. the declared amount, at two times.
  const start: IAutoMovieVector3 = directionOf(lampAt([SWING], 0));
  const middle: IAutoMovieVector3 = directionOf(lampAt([SWING], 2));
  const end: IAutoMovieVector3 = directionOf(lampAt([SWING], 4));
  TestValidator.equals(
    "a keyed light faces where it was keyed to, and turns by the declared amount",
    namedFacts([
      [
        "startsFacingMinusZ",
        (): boolean => vclose(start, { x: 0, y: 0, z: -1 }),
      ],
      [
        "sweepsHalfwayAtTheMidpoint",
        (): boolean =>
          vclose(middle, {
            x: -Math.SQRT1_2,
            y: 0,
            z: -Math.SQRT1_2,
          }),
      ],
      ["endsFacingMinusX", (): boolean => vclose(end, { x: -1, y: 0, z: 0 })],
      [
        "turnsNinetyDegreesInAll",
        (): boolean => nclose(angleBetween(start, end), 90),
      ],
      [
        "turnsFortyFiveByTheMidpoint",
        (): boolean => nclose(angleBetween(start, middle), 45),
      ],
    ]),
    {
      startsFacingMinusZ: true,
      sweepsHalfwayAtTheMidpoint: true,
      endsFacingMinusX: true,
      turnsNinetyDegreesInAll: true,
      turnsFortyFiveByTheMidpoint: true,
    },
  );

  // 2. position travels; everything unaddressed is untouched.
  const walked: IAutoMovieLight = lampAt(
    [
      clip(
        "lampWalks",
        pointer("/lights/lamp/position", "vec3"),
        [0, 4],
        [2, 4, 0, 6, 4, -8],
      ),
    ],
    2,
  );
  const dimmed: IAutoMovieLight = lampAt(
    [
      clip(
        "lampDims",
        pointer("/lights/lamp/intensity", "scalar"),
        [0, 4],
        [2, 0.5],
      ),
    ],
    4,
  );
  TestValidator.equals(
    "a moved light travels, keeps its staged rotation and scale, and an unmoved one keeps its transform by identity",
    namedFacts([
      [
        "travelsToTheMidpoint",
        (): boolean =>
          vclose(walked.transform.translation, { x: 4, y: 4, z: -4 }),
      ],
      [
        "keepsStagedRotation",
        (): boolean => vclose(directionOf(walked), { x: 0, y: 0, z: 1 }),
      ],
      [
        "keepsStagedScale",
        (): boolean => vclose(walked.transform.scale, { x: 1.5, y: 0.5, z: 2 }),
      ],
      ["dimmedIsANewLight", (): boolean => dimmed !== lamp],
      [
        "dimmedKeepsTransformByIdentity",
        (): boolean => dimmed.transform === lamp.transform,
      ],
    ]),
    {
      travelsToTheMidpoint: true,
      keepsStagedRotation: true,
      keepsStagedScale: true,
      dimmedIsANewLight: true,
      dimmedKeepsTransformByIdentity: true,
    },
  );

  // 3. placement accumulates beside the older axes, on one light.
  const both: IAutoMovieLight = lampAt(
    [
      SWING,
      clip(
        "lampWalks",
        pointer("/lights/lamp/position", "vec3"),
        [0, 4],
        [2, 4, 0, 6, 4, -8],
      ),
      clip(
        "lampOpens",
        pointer("/lights/lamp/coneAngle", "scalar"),
        [0, 4],
        [40, 70],
      ),
    ],
    4,
  );
  TestValidator.equals(
    "rotation, position and cone all land on the same light",
    namedFacts([
      [
        "turned",
        (): boolean => vclose(directionOf(both), { x: -1, y: 0, z: 0 }),
      ],
      [
        "travelled",
        (): boolean =>
          vclose(both.transform.translation, { x: 6, y: 4, z: -8 }),
      ],
      [
        "opened",
        (): boolean => both.type === "spot" && nclose(both.coneAngle, 70),
      ],
    ]),
    { turned: true, travelled: true, opened: true },
  );

  // 4. the kind split, in both directions.
  const throwsOn: (clips: IAutoMovieClip[], fragment: string) => boolean = (
    clips: IAutoMovieClip[],
    fragment: string,
  ): boolean =>
    throwsError(
      (): IAutoMovieLight[] =>
        resolveShotLighting({ lights: LIGHTS, clips, seconds: 1 }),
      [fragment],
    );
  TestValidator.equals(
    "a directional light has no position and a point light has no rotation",
    namedFacts([
      [
        "throwsOnSunPosition",
        (): boolean =>
          throwsOn(
            [
              clip(
                "sunWalks",
                pointer("/lights/sun/position", "vec3"),
                [0, 4],
                [0, 0, 0, 1, 1, 1],
              ),
            ],
            "which a directional light does not carry",
          ),
      ],
      [
        "throwsOnBulbRotation",
        (): boolean =>
          throwsOn(
            [
              clip(
                "bulbTurns",
                pointer("/lights/bulb/rotation", "quaternion"),
                [0, 4],
                [...keyed(aboutY(0)), ...keyed(aboutY(90))],
              ),
            ],
            "which a point light does not carry",
          ),
      ],
    ]),
    { throwsOnSunPosition: true, throwsOnBulbRotation: true },
  );
}
