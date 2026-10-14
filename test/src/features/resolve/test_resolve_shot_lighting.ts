import { resolveShotLighting } from "../../../../packages/engine/src/resolve/resolveShotLighting";
import { AutoMovieChannelValueType, IAutoMovieChannel, IAutoMovieClip, IAutoMovieLight } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { IDENTITY_TRANSFORM } from "../internal/IDENTITY_TRANSFORM";
import { namedFacts } from "../internal/namedFacts";
import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";

const WARM: { r: number; g: number; b: number; a: null; hex: string; } = { r: 1, g: 0.8, b: 0.5, a: null, hex: "#ffcc80" };

const candle: IAutoMovieLight = {
  id: "candleGlow",
  type: "point",
  transform: IDENTITY_TRANSFORM,
  color: WARM,
  intensity: 1.4,
  range: 4,
};

const sun: IAutoMovieLight = {
  id: "sun",
  type: "directional",
  transform: IDENTITY_TRANSFORM,
  color: { r: 1, g: 1, b: 1, a: null, hex: null },
  intensity: 3,
};

const lamp: IAutoMovieLight = {
  id: "lamp",
  type: "spot",
  transform: IDENTITY_TRANSFORM,
  color: { r: 1, g: 1, b: 1, a: null, hex: null },
  intensity: 2,
  range: 10,
  coneAngle: 40,
};

const LIGHTS: IAutoMovieLight[] = [candle, sun, lamp];

/** A one-track light clip over `channel`, on the beat's three-second clock. */
const clip: (id: string, channel: IAutoMovieChannel, times: number[], values: number[], interpolation?: "step" | "linear") => IAutoMovieClip = (
  id: string,
  channel: IAutoMovieChannel,
  times: number[],
  values: number[],
  interpolation: "step" | "linear" = "step",
): IAutoMovieClip => ({
  id,
  name: null,
  duration: 3,
  loop: false,
  tracks: [{ channel, times, values, interpolation }],
});

const pointer: (target: string, valueType: AutoMovieChannelValueType) => IAutoMovieChannel = (
  target: string,
  valueType: AutoMovieChannelValueType,
): IAutoMovieChannel => ({ kind: "pointer", pointer: target, valueType });

/** A resolved light's falloff range, or `-1` when its kind carries none. */
const rangeOf: (light: IAutoMovieLight) => number = (light: IAutoMovieLight): number =>
  light.type === "point" || light.type === "spot" ? light.range : -1;

/** A resolved light's cone half-angle, or `-1` when it is not a spot. */
const coneOf: (light: IAutoMovieLight) => number = (light: IAutoMovieLight): number =>
  light.type === "spot" ? light.coneAngle : -1;

/** The candle blowout S-03 asked for: warm, then near-black at the cue. */
const BLOWOUT: IAutoMovieClip = clip(
  "candleOut",
  pointer("/lights/candleGlow/intensity", "scalar"),
  [0, 1.55, 1.6, 3],
  [1.4, 1.4, 0.04, 0.04],
);

/** Intensity of one light in a resolved set, by id. */
const intensityOf: (lights: IAutoMovieLight[], id: string) => number = (lights: IAutoMovieLight[], id: string): number =>
  lights.find((light: IAutoMovieLight): boolean  => light.id === id)!.intensity;

/**
 * `resolveShotLighting` is the applier that makes a shot's light-time axis real
 * (#1348): the consumer that turns "the candle is 1.4 candela until 1.6s and
 * 0.04 after" from a committed statement into a number at any frame.
 *
 * Expected values here come from the glTF sampler contract and hand arithmetic,
 * not from what the pass emits. STEP holds `v_k` for `t_k <= t < t_{k+1}`, so
 * the value at the cue instant is the value AFTER the cue, and LINEAR at the
 * midpoint of a segment is the mean of its endpoints.
 *
 * The pass exists because the axis without an applier is #1339's false green
 * and an applier that skips part of its input is #1349, so every refusal here
 * is loud: a track this pass cannot honor throws rather than resolving to
 * something plausible.
 *
 * Scenarios:
 *
 * 1. S-03 realized. The blowout clip evaluates to 1.4 at `t = 0` (the lower
 *    boundary), 1.4 at the key `t = 1.55`, 1.4 at frame 38 of 72 (`38/24`),
 *    0.04 exactly AT the cue `t = 1.6`, 0.04 at frame 39 (`39/24`), and 0.04 at
 *    `t = duration` (the upper boundary). The one-keyframe hold the guide tells
 *    an author to write on the FOLLOWING beat (lighting does not inherit across
 *    a cut the way placement does) reads the same value at every instant.
 * 2. The negative twin the mission requires: a light no clip addresses comes back
 *    by IDENTITY, and so does every light when the shot carries no clips at
 *    all. A film that never changes its light gets the lights it staged,
 *    unchanged.
 * 3. The four authored value properties apply on a kind that carries them: a
 *    linear colour ramp read at its exact midpoint (`(1,0.8,0.5)` → `(0,0,0)`
 *    at `t = 1` of `[0, 2]` is `(0.5, 0.4, 0.25)`), a point light's `range`,
 *    and a spot's `coneAngle`. An animated colour drops the staged `hex` label,
 *    which describes a value the light no longer holds. The three punctual kinds
 *    rebuild with the checked parameters their discriminators carry: a dimmed
 *    directional has no falloff to keep, and a dimmed spot keeps the range and
 *    cone it was staged with rather than losing them to the write.
 * 4. Two tracks on ONE light both land (intensity and range together), so the pass
 *    accumulates per light rather than letting the last track win.
 * 5. Four loud refusals, one per way an artifact can address something the pass
 *    cannot write: a node channel, a pointer that is not a light pointer, a
 *    light the scene does not stage, and `range` on a directional light (a kind
 *    that carries no falloff). Each throws instead of skipping.
 *
 * @evidence contracts/testing.md#behavioral-verification Resolves real light clips and observes cue values, untouched reference identity, color/range/cone writes, per-light accumulation and loud refusal of unsupported or absent targets.
 * @evidence contracts/testing.md#independent-expectations Authored STEP keys hold1.4 before the1.6-second cue and0.04 from the cue; linear endpoint means give the color midpoint, while untouched staged objects and kind-specific parameters supply identity/preservation expectations.
 * @evidence contracts/testing.md#distinguishing-cases Cue boundaries, a singleton hold, no clips/unaddressed lights, each authored value property and two simultaneous fields contrast valid writes with node/foreign/missing/kind-mismatch refusals; transform and area-light behavior have separate cases.
 * @evidence contracts/testing.md#execution-ownership The named test_resolve_shot_lighting entry synchronously executes portable numerical light records through direct source calls; cue values do not prove that a physically rendered candle appears dark.
 */
export function test_resolve_shot_lighting(): void {
  // 1. S-03, at the instants that decide the beat.
  const at: (seconds: number) => number = (seconds: number): number =>
    intensityOf(
      resolveShotLighting({ lights: LIGHTS, clips: [BLOWOUT], seconds }),
      "candleGlow",
    );
  TestValidator.predicate(
    "the candle holds warm, then reads dark from the cue instant onward",
    sameValues([at(0), at(1.55), at(38 / 24), at(1.6), at(39 / 24), at(3)], [1.4, 1.4, 1.4, 0.04, 0.04, 0.04]),
  );

  // The hold the guide tells an author to write when a light must STAY changed
  // across a cut: one keyframe, read the same at every instant of the beat.
  const held: IAutoMovieClip = clip(
    "candleStaysOut",
    pointer("/lights/candleGlow/intensity", "scalar"),
    [0],
    [0.04],
  );
  TestValidator.predicate(
    "a one-keyframe track holds its value for the whole beat",
    sameValues([0, 1.7, 3].map((seconds: number): number  =>
      intensityOf(
        resolveShotLighting({ lights: LIGHTS, clips: [held], seconds }),
        "candleGlow",
      ),
    ), [0.04, 0.04, 0.04]),
  );

  // 2. the negative twin: untouched lights are the SAME objects.
  const resolved: IAutoMovieLight[] = resolveShotLighting({
    lights: LIGHTS,
    clips: [BLOWOUT],
    seconds: 3,
  });
  TestValidator.equals(
    "a light no clip addresses comes back by identity",
    namedFacts([
      ["resolvedSun", (): boolean  => resolved[1] === sun],
      ["resolvedLamp", (): boolean  => resolved[2] === lamp],
      ["resolvedCandle", (): boolean  => resolved[0] !== candle],
    ]),
    { resolvedSun: true, resolvedLamp: true, resolvedCandle: true },
  );
  TestValidator.predicate(
    "and a shot with no light clips changes nothing at all",
    resolveShotLighting({ lights: LIGHTS, clips: [], seconds: 1.7 }).every(
      (light: IAutoMovieLight, i: number): boolean  => light === LIGHTS[i],
    ),
  );

  // 3. four authored value properties, on kinds that carry them.
  const ramp: IAutoMovieLight = resolveShotLighting({
    lights: LIGHTS,
    clips: [
      clip(
        "warmToBlack",
        pointer("/lights/candleGlow/color", "vec3"),
        [0, 2],
        [1, 0.8, 0.5, 0, 0, 0],
        "linear",
      ),
    ],
    seconds: 1,
  })[0]!;
  TestValidator.equals(
    "a linear colour ramp reads its midpoint, and drops the stale hex label",
    namedFacts([
      ["ncloseRampColor", (): boolean  => nclose(ramp.color.r, 0.5)],
      ["ncloseRampColor2", (): boolean  => nclose(ramp.color.g, 0.4)],
      ["ncloseRampColor3", (): boolean  => nclose(ramp.color.b, 0.25)],
      ["rampColorHex", (): boolean  => ramp.color.hex === null],
    ]),
    {
      ncloseRampColor: true,
      ncloseRampColor2: true,
      ncloseRampColor3: true,
      rampColorHex: true,
    },
  );
  const widened: IAutoMovieLight[] = resolveShotLighting({
    lights: LIGHTS,
    clips: [
      clip(
        "candleReach",
        pointer("/lights/candleGlow/range", "scalar"),
        [0, 3],
        [4, 9],
        "linear",
      ),
      clip(
        "lampOpens",
        pointer("/lights/lamp/coneAngle", "scalar"),
        [0, 3],
        [40, 70],
        "linear",
      ),
    ],
    seconds: 3,
  });
  TestValidator.predicate(
    "range and coneAngle apply on the kinds that carry them",
    sameValues([rangeOf(widened[0]!), coneOf(widened[2]!)], [9, 70]),
  );
  // The directional and spot kinds rebuild, including the one with no falloff at
  // all: a sunset dims the directional light, and a spot dimmed without a cone
  // track keeps the cone it was staged with.
  const dusk: IAutoMovieLight[] = resolveShotLighting({
    lights: LIGHTS,
    clips: [
      clip(
        "sunset",
        pointer("/lights/sun/intensity", "scalar"),
        [0, 3],
        [3, 0.5],
        "linear",
      ),
      clip(
        "lampDown",
        pointer("/lights/lamp/intensity", "scalar"),
        [0, 3],
        [2, 1],
        "linear",
      ),
    ],
    seconds: 3,
  });
  TestValidator.predicate(
    "a directional and a spot rebuild with the parameters their kinds carry",
    sameValues([
      dusk[1]!.intensity,
      rangeOf(dusk[1]!),
      dusk[2]!.intensity,
      rangeOf(dusk[2]!),
      coneOf(dusk[2]!),
    ], [0.5, -1, 1, 10, 40]),
  );

  // 4. two tracks, one light.
  const both: IAutoMovieLight = resolveShotLighting({
    lights: LIGHTS,
    clips: [
      BLOWOUT,
      clip(
        "candleReach",
        pointer("/lights/candleGlow/range", "scalar"),
        [0, 3],
        [4, 9],
        "linear",
      ),
    ],
    seconds: 3,
  })[0]!;
  TestValidator.predicate(
    "intensity and range both land on the same light",
    sameValues([both.intensity, rangeOf(both)], [0.04, 9]),
  );

  // 5. every way to address what the pass cannot write, refused loudly.
  const throwsOn: (clips: IAutoMovieClip[], fragment: string) => boolean = (clips: IAutoMovieClip[], fragment: string): boolean =>
    throwsError(
      (): IAutoMovieLight[]  => resolveShotLighting({ lights: LIGHTS, clips, seconds: 1 }),
      [fragment],
    );
  TestValidator.equals(
    "a node channel, a foreign pointer, a missing light, and a kind mismatch all throw",
    namedFacts([
      [
        "throwsOnClipNodeTrack",
        (): boolean  =>
          throwsOn(
            [
              clip(
                "nodeTrack",
                { kind: "node", node: "candleGlow", path: "translation" },
                [0, 3],
                [0, 0, 0, 1, 0, 0],
              ),
            ],
            "must address /lights/<id>/<property>",
          ),
      ],
      [
        "throwsOnClipMaterialTrack",
        (): boolean  =>
          throwsOn(
            [
              clip(
                "materialTrack",
                pointer("/materials/2/baseColor", "vec3"),
                [0, 3],
                [1, 1, 1, 0, 0, 0],
              ),
            ],
            "must address /lights/<id>/<property>",
          ),
      ],
      [
        "throwsOnClipGhostTrack",
        (): boolean  =>
          throwsOn(
            [
              clip(
                "ghostTrack",
                pointer("/lights/ghost/intensity", "scalar"),
                [0, 3],
                [1, 0],
              ),
            ],
            'addresses missing light "ghost"',
          ),
      ],
      [
        "throwsOnClipSunRange",
        (): boolean  =>
          throwsOn(
            [
              clip(
                "sunRange",
                pointer("/lights/sun/range", "scalar"),
                [0, 3],
                [1, 0],
              ),
            ],
            "which a directional light does not carry",
          ),
      ],
    ]),
    {
      throwsOnClipNodeTrack: true,
      throwsOnClipMaterialTrack: true,
      throwsOnClipGhostTrack: true,
      throwsOnClipSunRange: true,
    },
  );
}

/** Compare array length and finite scalar values with zero absolute tolerance. */
function sameValues(actual: number[], expected: number[]): boolean {
  return actual.length === expected.length && actual.every((value: number, index: number): boolean => nclose(value, expected[index]!, 0));
}
