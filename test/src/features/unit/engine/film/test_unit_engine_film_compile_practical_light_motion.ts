import { Quaternion, compilePracticalLightMotion } from "@automovie/engine";
import type {
  IAutoMovieClip,
  IAutoMovieCompilePracticalLightMotion,
  IAutoMovieSpotLight,
  IAutoMovieTrack,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

/**
 * A practical light follows a prop's separately started TRS channels.
 *
 * Scenarios:
 *
 * 1. A half-metre emitter at local +Y stands one metre above the staged root under
 *    Y scale two. Translation starts at 1/4. A +90-degree Z rotation starts at
 *    3/4, moving the emitter and beam toward -X.
 * 2. The compiler sorts and deduplicates time samples, escapes pointer ids, and
 *    switches on the exact half-open interval. A flame's amplitude keys instead
 *    follow its mean-normalized area inside its envelope.
 * 3. A moving prop needs sample times in range and an ordered on interval.
 *
 * The dyadic coordinates are exact before the turn. The unit rotation's vector
 * and normalization arithmetic fit a 32-ulp bound at unit scale.
 */
export function test_unit_engine_film_compile_practical_light_motion(): void {
  const identity: IAutoMovieTransform = {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
  const light: IAutoMovieSpotLight = {
    id: "lens/a~b",
    type: "spot",
    transform: identity,
    color: { r: 1, g: 1, b: 1, a: null, hex: null },
    intensity: 8,
    range: 12,
    coneAngle: 15,
  };
  const motion: IAutoMovieClip = {
    id: "prop",
    duration: 1,
    name: null,
    loop: false,
    tracks: [
      {
        channel: { kind: "node", node: "torch", path: "translation" },
        times: [0.25, 1],
        values: [2, 0, 0, 2, 0, 0],
        interpolation: "linear",
      },
      {
        channel: { kind: "node", node: "torch", path: "rotation" },
        times: [0.75, 1],
        values: [
          0,
          0,
          Math.SQRT1_2,
          Math.SQRT1_2,
          0,
          0,
          Math.SQRT1_2,
          Math.SQRT1_2,
        ],
        interpolation: "linear",
      },
    ],
  };
  const input: IAutoMovieCompilePracticalLightMotion = {
    id: "practical",
    duration: 1,
    light,
    prop: {
      id: "torch",
      transform: {
        ...identity,
        translation: { x: 10, y: 0, z: 0 },
        scale: { x: 1, y: 2, z: 1 },
      },
    },
    emitter: { frame: { ...identity, translation: { x: 0, y: 0.5, z: 0 } } },
    objectMotions: [motion],
    sampleTimes: [0.75, 0.375, 0.75],
    on: [0.25, 0.75],
  };
  const clip: IAutoMovieClip = compilePracticalLightMotion(input);
  const [position, rotation, intensity]: IAutoMovieTrack[] = clip.tracks;
  TestValidator.equals(
    "escaped track ids",
    clip.tracks.map(({ channel }) =>
      channel.kind === "pointer" ? channel.pointer : "",
    ),
    [
      "/lights/lens~1a~0b/position",
      "/lights/lens~1a~0b/rotation",
      "/lights/lens~1a~0b/intensity",
    ],
  );
  const times: number[] = [0, 0.25, 0.375, 0.75, 1];
  TestValidator.equals(
    "merged canonical frame grid",
    [position!.times, rotation!.times],
    [times, times],
  );
  const frameRoundoff: number = 32 * Number.EPSILON;
  const expected: number[] = [10, 1, 0, 2, 1, 0, 2, 1, 0, 1, 0, 0, 1, 0, 0];
  TestValidator.predicate(
    "each emitter position follows its active channel frame",
    position!.values.length === expected.length &&
      position!.values.every(
        (value: number, index: number) =>
          Math.abs(value - expected[index]!) <= frameRoundoff,
      ),
  );
  for (const [index, own] of [
    { x: 0, y: 1, z: 0 },
    { x: -1, y: 0, z: 0 },
  ].entries()) {
    const i: number = index === 0 ? 0 : 12;
    const aim: IAutoMovieVector3 = Quaternion.rotateVector(
      {
        x: rotation!.values[i]!,
        y: rotation!.values[i + 1]!,
        z: rotation!.values[i + 2]!,
        w: rotation!.values[i + 3]!,
      },
      { x: 0, y: 0, z: -1 },
    );
    TestValidator.predicate(
      "the emitted light turns with its emitter",
      Math.hypot(aim.x - own.x, aim.y - own.y, aim.z - own.z) <= frameRoundoff,
    );
  }
  TestValidator.equals(
    "switch keys have an exclusive ending",
    [intensity!.interpolation, intensity!.times, intensity!.values],
    ["step", [0, 0.25, 0.75], [0, 8, 0]],
  );
  const flicker: IAutoMovieClip = compilePracticalLightMotion({
    ...input,
    flicker: {
      times,
      areas: [1, 1, 3, 4, 2],
      inside: [false, true, true, false, false],
      mean: 2,
    },
  });
  TestValidator.equals(
    "the flame sets on-state amplitude",
    flicker.tracks[2]?.values,
    [0, 4, 12, 0, 0],
  );

  const still: IAutoMovieClip = compilePracticalLightMotion({
    ...input,
    light: {
      id: light.id,
      type: "point",
      transform: identity,
      color: light.color,
      intensity: 8,
      range: 12,
    },
    objectMotions: undefined,
    sampleTimes: undefined,
    on: undefined,
  });
  TestValidator.predicate(
    "a steady point does not override staged brightness or rotation",
    still.tracks.length === 1 &&
      still.tracks[0]!.values.every(
        (value: number, i: number) => value === [10, 1, 0][i % 3],
      ),
  );

  TestValidator.predicate(
    "bad sample and interval premises fail at compilation",
    throwsError(
      (): unknown =>
        compilePracticalLightMotion({ ...input, on: [0.75, 0.25] }),
      "practical light interval",
    ) &&
      throwsError(
        (): unknown =>
          compilePracticalLightMotion({ ...input, sampleTimes: [2] }),
        "sample times must lie",
      ) &&
      throwsError(
        (): unknown =>
          compilePracticalLightMotion({ ...input, sampleTimes: [] }),
        "sample times are required",
      ),
  );
}
