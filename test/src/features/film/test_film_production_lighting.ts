import {
  AutoMovieChannelValueType,
  IAutoMovieChannel,
  IAutoMovieClip,
  IAutoMovieLight,
  IAutoMovieProductionLighting,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { inheritProductionLighting } from "../../../../packages/engine/src/film/inheritProductionLighting";
import { Quaternion } from "../../../../packages/engine/src/math/Quaternion";
import { IDENTITY_TRANSFORM } from "../internal/fixtures";
import { namedFacts, nclose, vclose } from "../internal/predicates";

/**
 * Half an hour of story time, in seconds: the span the film runs across.
 */
const SPAN: number = 1800;

const pointer: (
  target: string,
  valueType: AutoMovieChannelValueType,
) => IAutoMovieChannel = (
  target: string,
  valueType: AutoMovieChannelValueType,
): IAutoMovieChannel => ({ kind: "pointer", pointer: target, valueType });

/**
 * A one-track clip on the STORY clock, which is as long as the span it covers.
 */
const storyClip: (
  id: string,
  channel: IAutoMovieChannel,
  times: number[],
  values: number[],
) => IAutoMovieClip = (
  id: string,
  channel: IAutoMovieChannel,
  times: number[],
  values: number[],
): IAutoMovieClip => ({
  id,
  name: null,
  duration: SPAN,
  loop: false,
  tracks: [{ channel, times, values, interpolation: "linear" }],
});

const keyed: (q: IAutoMovieQuaternion) => number[] = (
  q: IAutoMovieQuaternion,
): number[] => [q.x, q.y, q.z, q.w];

const aboutY: (deg: number) => IAutoMovieQuaternion = (
  deg: number,
): IAutoMovieQuaternion => Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, deg);

const directionOf: (light: IAutoMovieLight) => IAutoMovieVector3 = (
  light: IAutoMovieLight,
): IAutoMovieVector3 =>
  Quaternion.rotateVector(light.transform.rotation, { x: 0, y: 0, z: -1 });

/**
 * The authored directional source turns a quarter turn and fades over the span.
 */
const daylight: IAutoMovieLight = {
  id: "daylight",
  type: "directional",
  transform: IDENTITY_TRANSFORM,
  color: { r: 1, g: 1, b: 1, a: null, hex: null },
  intensity: 3,
};

const moon: IAutoMovieLight = {
  id: "moon",
  type: "directional",
  transform: IDENTITY_TRANSFORM,
  color: { r: 0.6, g: 0.7, b: 1, a: null, hex: null },
  intensity: 0.2,
};

const lighting: (
  overrides?: Partial<IAutoMovieProductionLighting>,
) => IAutoMovieProductionLighting = (
  overrides: Partial<IAutoMovieProductionLighting> = {},
): IAutoMovieProductionLighting => ({
  id: "production-light",
  name: null,
  lights: [daylight],
  motions: [
    storyClip(
      "daylightTurns",
      pointer("/lights/daylight/rotation", "quaternion"),
      [0, SPAN],
      [...keyed(aboutY(0)), ...keyed(aboutY(90))],
    ),
    storyClip(
      "daylightFades",
      pointer("/lights/daylight/intensity", "scalar"),
      [0, SPAN],
      [3, 0.5],
    ),
  ],
  ...overrides,
});

/**
 * A scene light of the shot's own, which the production never addresses.
 */
const practical: IAutoMovieLight = {
  id: "practical",
  type: "point",
  transform: IDENTITY_TRANSFORM,
  color: { r: 1, g: 0.8, b: 0.5, a: null, hex: null },
  intensity: 1.4,
  range: 4,
};

/**
 * A scene's own copy of the production source: a reference, not a restaging.
 *
 * It faces +Z at intensity .1 while the source opens facing -Z at intensity 3,
 * distinguishing inherited state from an unchanged staged copy.
 */
const stagedDaylight: IAutoMovieLight = {
  id: "daylight",
  type: "directional",
  transform: {
    ...IDENTITY_TRANSFORM,
    rotation: { x: 0, y: 1, z: 0, w: 0 },
  },
  color: { r: 1, g: 1, b: 1, a: null, hex: null },
  intensity: 0.1,
};

const lightOf: (lights: IAutoMovieLight[], id: string) => IAutoMovieLight = (
  lights: IAutoMovieLight[],
  id: string,
): IAutoMovieLight =>
  lights.find((light: IAutoMovieLight): boolean => light.id === id)!;

/**
 * Resolves inherited story-clock lights and checks endpoint/midpoint direction and intensity, rate mapping, missing lighting/pin pass-through identity and ordered replacement/append.
 *
 * Scenarios:
 * 1. Resolve start, midpoint and end against deliberately different staged state.
 * 2. Compress the authored story span into two shot seconds.
 * 3. Preserve staged element identity/order/count when production or pin is absent.
 * 4. Replace production ids in place, retain practical identity and append the untouched moon.
 *
 * @evidence contracts/testing.md#behavioral-verification Resolves inherited story-clock lights and checks endpoint/midpoint direction and intensity, rate mapping, missing lighting/pin pass-through identity and ordered replacement/append.
 * @evidence contracts/testing.md#independent-expectations A quarter Y-turn carries -Z to -X with a -sqrt(1/2) midpoint, and linear intensity 3 to .5 gives 1.75 halfway; authored ids define the merge order. Product quaternion helpers generate/read rotations, so common quaternion defects remain outside the independent intensity arithmetic.
 * @evidence contracts/testing.md#distinguishing-cases Retains start/middle/end, compressed shot rate, deliberately different staged state, null production/pin, practical identity and unstaged moon append; malformed lighting is not owned by this positive entry.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous test_film_production_lighting unit entry owns its assertions and delegated helpers through portable source functions; it opens no process, browser, GPU or installed consumer.
 */
export function test_film_production_lighting(): void {
  const staged: IAutoMovieLight[] = [practical, stagedDaylight];
  const at: (originSeconds: number, seconds?: number) => IAutoMovieLight = (
    originSeconds: number,
    seconds: number = 0,
  ): IAutoMovieLight =>
    lightOf(
      inheritProductionLighting({
        lighting: lighting(),
        lights: staged,
        pin: { originSeconds },
        seconds,
      }),
      "daylight",
    );

  // 1. one source, three story moments, three lightings.
  const opening: IAutoMovieLight = at(0);
  const midday: IAutoMovieLight = at(SPAN / 2);
  const closing: IAutoMovieLight = at(SPAN);
  TestValidator.predicate(
    "shots pinned at different story times inherit different states from one source",
    // The staged copy faces +Z at .1, distinguishing inheritance from pass-through.
    vclose(directionOf(opening), { x: 0, y: 0, z: -1 }) &&
      nclose(opening.intensity, 3) &&
      vclose(directionOf(midday), {
        x: -Math.SQRT1_2,
        y: 0,
        z: -Math.SQRT1_2,
      }) &&
      nclose(midday.intensity, 1.75) &&
      vclose(directionOf(closing), { x: -1, y: 0, z: 0 }) &&
      nclose(closing.intensity, 0.5),
  );

  // 2. a compressed shot crosses the whole span from inside two seconds.
  const compressed: (seconds: number) => IAutoMovieLight = (
    seconds: number,
  ): IAutoMovieLight =>
    lightOf(
      inheritProductionLighting({
        lighting: lighting(),
        lights: staged,
        pin: { originSeconds: 0, rate: SPAN / 2 },
        seconds,
      }),
      "daylight",
    );
  TestValidator.predicate(
    "a shot that compresses story time carries the source at its own rate",
    nclose(compressed(1).intensity, 1.75) &&
      vclose(directionOf(compressed(2)), { x: -1, y: 0, z: 0 }),
  );

  // 3. nothing declared, or nothing pinned: unchanged, element by element.
  const undeclared: IAutoMovieLight[] = inheritProductionLighting({
    lighting: null,
    lights: staged,
    pin: { originSeconds: SPAN },
    seconds: 0,
  });
  const unpinned: IAutoMovieLight[] = inheritProductionLighting({
    lighting: lighting(),
    lights: staged,
    pin: null,
    seconds: 0,
  });
  TestValidator.equals(
    "a production declaring no lighting, and an unpinned shot, are unchanged from today",
    namedFacts([
      [
        "undeclaredIsTheStagedList",
        (): boolean =>
          undeclared.every(
            (light: IAutoMovieLight, i: number): boolean => light === staged[i],
          ),
      ],
      [
        "undeclaredAddsNothing",
        (): boolean => undeclared.length === staged.length,
      ],
      [
        "unpinnedIsTheStagedList",
        (): boolean =>
          unpinned.every(
            (light: IAutoMovieLight, i: number): boolean => light === staged[i],
          ),
      ],
      ["unpinnedAddsNothing", (): boolean => unpinned.length === staged.length],
    ]),
    {
      undeclaredIsTheStagedList: true,
      undeclaredAddsNothing: true,
      unpinnedIsTheStagedList: true,
      unpinnedAddsNothing: true,
    },
  );

  // 4. replace by id in place, keep the rest by identity, append the unstaged.
  const merged: IAutoMovieLight[] = inheritProductionLighting({
    lighting: lighting({ lights: [daylight, moon] }),
    lights: staged,
    pin: { originSeconds: SPAN },
    seconds: 0,
  });
  TestValidator.equals(
    "the merge replaces by id in staging order and appends an unstaged source last",
    merged.map((light: IAutoMovieLight): string => light.id),
    ["practical", "daylight", "moon"],
  );
  TestValidator.equals(
    "an unaddressed staged light and an untouched source retain identity",
    namedFacts([
      ["practicalByIdentity", (): boolean => merged[0] === practical],
      ["daylightIsInherited", (): boolean => merged[1] !== stagedDaylight],
      ["moonByIdentity", (): boolean => merged[2] === moon],
    ]),
    {
      practicalByIdentity: true,
      daylightIsInherited: true,
      moonByIdentity: true,
    },
  );
  TestValidator.predicate(
    "the merged daylight carries its closing intensity",
    nclose(merged[1]!.intensity, 0.5),
  );
}
