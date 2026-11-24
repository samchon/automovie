import { createLight } from "@automovie/archetypes";
import {
  blackbodyAutoMovieColor,
  heskestadFlameHeight,
  performShot,
  puffingFrequency,
  sampleAutoMovieFlame,
  stageScene,
  validateShotArtifact,
} from "@automovie/engine";
import type {
  IAutoMovieClip,
  IAutoMovieConstraintViolation,
  IAutoMovieFlameCue,
  IAutoMovieModel,
  IAutoMoviePerformShotProps,
  IAutoMoviePerformedShot,
  IAutoMovieScript,
  IAutoMovieStagedSet,
  IAutoMovieTrack,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
} from "../internal/filmFixtures";
import { nclose } from "../internal/nclose";

/**
 * A flame cue's shape and its bound light's flicker are closed forms of shot
 * time, and admission refuses every malformed cue with its own diagnostic.
 *
 * Scenarios:
 *
 * 1. Heskestad's height reproduces 0.614 m for 50 kW over 0.5 m and −0.063 m for 5
 *    kW over 0.5 m; the puffing frequency is 2.12 Hz for 0.5 m.
 * 2. A candle flame's mesh and area at 1.37 s are identical whether sampled after
 *    a sequential run over earlier times or directly.
 * 3. A candle bound to a point light with `on` = [0.5, 2) in a 3 s shot gives
 *    exactly one intensity track for that light, `step`, keyed on every
 *    multiple of 1/120 s in [0, 3]; every key in [0.5, 2) holds I_on · A(t) /
 *    Ā, every other key holds 0, and the mean over the keys in [0.5, 2) is I_on
 *    within 1e-12. With `on` omitted the track still exists and has no zero
 *    key.
 * 4. Refusals: a duplicate id, an unstaged node, a missing emitter, a zero height,
 *    an open fire of 0.03 m (8.66 Hz puffing), an open fire whose Heskestad
 *    height is negative, a light naming no binding, an emission given with a
 *    light, and neither light nor emission.
 * 5. A blackbody colour at 1900 K is warm: red is the largest channel and blue the
 *    smallest.
 * 6. At the compiled shot's artifact boundary, the admitted flames pass, and a
 *    bound flame naming no light clip and a 0.03 m open fire are each refused at
 *    their own path.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists each scenario's input and the closed form, track or diagnostic it pins.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public shape sampler, performShot and validateShotArtifact and reads the compiled light clip's track, keys and values and the artifact findings.
 * @evidence contracts/development/testing.md#independent-expectations The Heskestad and Cetegen–Ahmed numbers are the issue's worked examples from the published correlations; the light values are recomputed from the sampler's area at each key and the authored intensity, and the mean identity follows from Ā's definition.
 * @evidence contracts/development/testing.md#distinguishing-cases Inside, boundary and outside keys of `on`; `on` present and absent; each refusal changes one field of a valid cue; the 0.03 m fire sits just past the 0.04 m limit; the artifact boundary sees the admitted shot pass beside one changed field per refusal.
 * @evidence contracts/development/testing.md#execution-ownership Synchronous in-memory engine work; drawing is owned by the render flame tests.
 */
export function test_film_flame_cues(): void {
  // 1. Published correlations.
  TestValidator.predicate(
    "Heskestad 50 kW over 0.5 m",
    nclose(heskestadFlameHeight(50, 0.5), 0.6138, 5e-4),
  );
  TestValidator.predicate(
    "Heskestad 5 kW over 0.5 m",
    nclose(heskestadFlameHeight(5, 0.5), -0.0626, 5e-4),
  );
  TestValidator.predicate(
    "Cetegen-Ahmed 0.5 m",
    nclose(puffingFrequency(0.5), 2.1213, 1e-4),
  );

  // 2. Seek and sequential sampling agree.
  const small: Pick<IAutoMovieFlameCue, "id" | "seed" | "size"> = {
    id: "wick",
    seed: 7,
    size: { kind: "small", height: 0.03, radius: 0.006 },
  };
  for (const time of [0, 0.4, 0.9, 1.2]) sampleAutoMovieFlame(small, time);
  const sequential: ReturnType<typeof sampleAutoMovieFlame> =
    sampleAutoMovieFlame(small, 1.37);
  TestValidator.equals(
    "seek equals sequential",
    sampleAutoMovieFlame(small, 1.37),
    sequential,
  );

  // 3. Light coupling.
  const candle: IAutoMovieModel = createLight({ id: "candle", kind: "candle" });
  const script: IAutoMovieScript = makeScriptWrite();
  const staged: IAutoMovieStagedSet = stageScene(
    script,
    makeStagingWrite({
      set: [
        {
          node: "table-candle",
          model: candle.id,
          position: { x: 0, y: 1, z: 0 },
        },
      ],
      lights: [
        {
          node: "candle-light",
          type: "point",
          position: { x: 0, y: 1.2, z: 0 },
          color: { r: 1, g: 0.6, b: 0.3, a: null, hex: null },
          intensity: 1.2,
          range: 6,
        },
      ],
    }),
  );
  if (!staged.success) throw new Error(JSON.stringify(staged.violations));
  const props: (
    on: [number, number] | undefined,
    flames: IAutoMovieFlameCue[],
  ) => IAutoMoviePerformShotProps = (
    on: [number, number] | undefined,
    flames: IAutoMovieFlameCue[],
  ): IAutoMoviePerformShotProps => ({
    script,
    staged,
    performance: makePerformanceWrite({ duration: 3, draft: [] }),
    synthesize: (): null => null,
    skeleton: (): null => null,
    models: [candle],
    practicalLights: [
      {
        id: "candle-glow",
        light: "candle-light",
        prop: "table-candle",
        emitter: "light",
        ...(on === undefined ? {} : { on }),
      },
    ],
    flames,
  });
  const cue: (on?: [number, number]) => IAutoMovieFlameCue = (
    on?: [number, number],
  ): IAutoMovieFlameCue => ({
    ...small,
    node: "table-candle",
    emitter: "light",
    light: "candle-glow",
    ...(on === undefined ? {} : { on }),
  });
  const intensity: (shot: IAutoMoviePerformedShot) => IAutoMovieTrack[] = (
    shot: IAutoMoviePerformedShot,
  ): IAutoMovieTrack[] => {
    if (!shot.success) throw new Error(JSON.stringify(shot.violations));
    return (shot.shot.lightMotions ?? [])
      .flatMap((clip: IAutoMovieClip): IAutoMovieTrack[] => clip.tracks)
      .filter(
        (track: IAutoMovieTrack): boolean =>
          track.channel.kind === "pointer" &&
          track.channel.pointer.endsWith("/intensity"),
      );
  };
  const tracks: IAutoMovieTrack[] = intensity(
    performShot(props([0.5, 2], [cue([0.5, 2])])),
  );
  TestValidator.equals("one step intensity track", tracks.length, 1);
  const track: IAutoMovieTrack = tracks[0]!;
  TestValidator.equals("step interpolation", track.interpolation, "step");
  TestValidator.equals(
    "keys on the 1/120 s grid",
    track.times,
    Array.from({ length: 361 }, (_: unknown, k: number): number => k / 120),
  );
  const areas: number[] = track.times.map(
    (time: number): number => sampleAutoMovieFlame(small, time).area,
  );
  const inside: number[] = track.times
    .map((time: number, index: number): number =>
      time >= 0.5 && time < 2 ? index : -1,
    )
    .filter((index: number): boolean => index >= 0);
  const mean: number =
    inside.reduce(
      (sum: number, index: number): number => sum + areas[index]!,
      0,
    ) / inside.length;
  TestValidator.predicate(
    "inside keys follow the area, outside keys are dark",
    track.times.every((time: number, index: number): boolean =>
      time >= 0.5 && time < 2
        ? nclose(track.values[index]!, (1.2 * areas[index]!) / mean, 1e-12)
        : track.values[index] === 0,
    ),
  );
  TestValidator.predicate(
    "the inside mean is the on-state intensity",
    nclose(
      inside.reduce(
        (sum: number, index: number): number => sum + track.values[index]!,
        0,
      ) / inside.length,
      1.2,
      1e-12,
    ),
  );
  const steady: IAutoMovieTrack[] = intensity(
    performShot(props(undefined, [cue()])),
  );
  TestValidator.predicate(
    "without on the track exists and never goes dark",
    steady.length === 1 &&
      steady[0]!.values.every((value: number): boolean => value > 0),
  );

  // 4. Refusals, each at its own path.
  const unbound: (patch: Partial<IAutoMovieFlameCue>) => IAutoMovieFlameCue = (
    patch: Partial<IAutoMovieFlameCue>,
  ): IAutoMovieFlameCue => ({
    ...cue(),
    light: undefined,
    emission: { luminance: 5000, color: blackbodyAutoMovieColor(1900) },
    ...patch,
  });
  const refusals: [string, IAutoMovieFlameCue[], string][] = [
    ["duplicate id", [unbound({}), unbound({})], "$input.flames[1].id"],
    ["unstaged node", [unbound({ node: "ghost" })], "$input.flames[0].node"],
    [
      "missing emitter",
      [unbound({ emitter: "nowhere" })],
      "$input.flames[0].emitter",
    ],
    [
      "zero height",
      [unbound({ size: { kind: "small", height: 0, radius: 0.006 } })],
      "$input.flames[0].size.height",
    ],
    [
      "too narrow an open fire",
      [unbound({ size: { kind: "open", heatRelease: 5, diameter: 0.03 } })],
      "$input.flames[0].size.diameter",
    ],
    [
      "negative Heskestad height",
      [unbound({ size: { kind: "open", heatRelease: 5, diameter: 0.5 } })],
      "$input.flames[0].size.heatRelease",
    ],
    [
      "light naming no binding",
      [{ ...cue(), light: "nothing" }],
      "$input.flames[0].light",
    ],
    [
      "emission with a light",
      [
        {
          ...cue(),
          emission: { luminance: 1, color: blackbodyAutoMovieColor(1900) },
        },
      ],
      "$input.flames[0].emission",
    ],
    [
      "neither light nor emission",
      [unbound({ emission: undefined })],
      "$input.flames[0].emission",
    ],
  ];
  for (const [title, flames, path] of refusals) {
    const result: IAutoMoviePerformedShot = performShot(
      props(undefined, flames),
    );
    TestValidator.predicate(
      `${title} is refused at ${path}`,
      result.success === false &&
        result.violations.some(
          (violation: IAutoMovieConstraintViolation): boolean =>
            violation.path === path,
        ),
    );
  }

  // 5. A warm blackbody.
  const warm: ReturnType<typeof blackbodyAutoMovieColor> =
    blackbodyAutoMovieColor(1900);
  TestValidator.predicate(
    "1900 K is red-dominant",
    warm.r === 1 && warm.r > warm.g && warm.g > warm.b,
  );

  // 6. The compiled shot's artifact boundary checks its flames too.
  const performed: IAutoMoviePerformedShot = performShot(
    props([0.5, 2], [cue([0.5, 2])]),
  );
  if (!performed.success) throw new Error(JSON.stringify(performed.violations));
  const artifact: (flames: unknown[]) => IAutoMovieConstraintViolation[] = (
    flames: unknown[],
  ): IAutoMovieConstraintViolation[] => {
    const checked: IAutoMovieValidation = validateShotArtifact(
      { ...performed.shot, flames: flames as IAutoMovieFlameCue[] },
      staged.scene,
      null,
    );
    return checked.success ? [] : checked.violations;
  };
  const admitted: IAutoMovieFlameCue = performed.shot.flames![0]!;
  TestValidator.equals("the compiled flames pass", artifact([admitted]), []);
  for (const [title, flame, path] of [
    [
      "a light naming no light clip",
      { ...admitted, light: "nothing" },
      "$input.flames[0].light",
    ],
    [
      "too narrow an open fire",
      { ...admitted, size: { kind: "open", heatRelease: 5, diameter: 0.03 } },
      "$input.flames[0].size.diameter",
    ],
  ] as const)
    TestValidator.predicate(
      `the artifact refuses ${title} at ${path}`,
      artifact([flame]).some(
        (violation: IAutoMovieConstraintViolation): boolean =>
          violation.path === path,
      ),
    );
}
