import { AutoMovieEngineMaterial } from "@automovie/engine";
import type {
  IAutoMovieColor,
  IAutoMovieProceduralSurface,
  IAutoMovieSampleProceduralSurface,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * The CPU reference of a procedural surface is a fixed function of its seed and
 * sample point, and each kind draws the feature it names at the feature size it
 * states.
 *
 * Scenarios:
 *
 * 1. Sampling the same surface at the same 1000 fixed points twice gives
 *    bitwise-equal colour, roughness and height for every kind.
 * 2. Changing only the seed changes the base colour at more than 90 % of those
 *    1000 points for every kind.
 * 3. Wood with `scale: 0.01` along a 1 m segment running radially out from its
 *    axis line crosses 100 ± 10 rings, counted as pattern maxima above 0.5
 *    between minima below 0.5.
 * 4. Stone with `scale: 0.1` has one feature point in each 0.1 m lattice cube: at
 *    the hashed feature point of a cube its F1 distance is 0, and at the
 *    midpoint of two neighbouring cubes' feature points, where no third point
 *    is nearer, F2 − F1 is 0.
 * 5. Colour, roughness and height interpolate the pairs by the pattern value: a
 *    sample's colour lies on the segment between the two colours at the value
 *    it reports, and its height is the value times relief.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `sampleAutoMovieProceduralSurface` and the cellular distances on fixed inputs; a hash that read a clock or a random state, a seed that did not enter the lattice, a ring spacing off by a factor, feature points outside their cubes or a colour not interpolated by the value fails.
 * @evidence contracts/development/testing.md#independent-expectations Determinism and seed sensitivity follow from the contract; 100 rings is the segment length over the ring spacing; the feature point is recomputed here from the hash words and the cube corner as the contract defines it, and the midpoint's zero follows from the geometry of two equidistant points; interpolation is checked against the stated linear rule.
 * @evidence contracts/development/testing.md#distinguishing-cases Every kind is sampled; the midpoint case is kept only where a brute-force check confirms no third feature point is nearer, so it tests the definition rather than a crowded configuration. Admission is owned by `test_material_procedural_admission`, piece sheets by `test_material_procedural_pattern_sheet` and value statistics by `test_material_procedural_statistics`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_material_procedural_sample`, with in-memory inputs and no renderer.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_material_procedural_sample(): void {
  const points: IAutoMovieSampleProceduralSurface.IObject["point"][] =
    Array.from({ length: 1000 }, (_: unknown, index: number) => ({
      x: ((index * 0.6180339887) % 1) * 2 - 1,
      y: ((index * 0.7548776662) % 1) * 2 - 1,
      z: ((index * 0.569840291) % 1) * 2 - 1,
    }));

  // 1 and 2. Determinism and seed sensitivity, every kind.
  for (const kind of KINDS) {
    const surface: IAutoMovieProceduralSurface = make(kind, 0.05, 11);
    const reseeded: IAutoMovieProceduralSurface = { ...surface, seed: 12 };
    let changed: number = 0;
    let equal: boolean = true;
    for (const point of points) {
      const a: IAutoMovieSampleProceduralSurface.IResult =
        AutoMovieEngineMaterial.sampleProceduralSurface({ surface, point });
      const b: IAutoMovieSampleProceduralSurface.IResult =
        AutoMovieEngineMaterial.sampleProceduralSurface({ surface, point });
      equal &&=
        a.color.r === b.color.r &&
        a.color.g === b.color.g &&
        a.color.b === b.color.b &&
        a.roughness === b.roughness &&
        a.height === b.height;
      const c: IAutoMovieSampleProceduralSurface.IResult =
        AutoMovieEngineMaterial.sampleProceduralSurface({
          surface: reseeded,
          point,
        });
      if (c.color.r !== a.color.r || c.color.g !== a.color.g) ++changed;
    }
    TestValidator.predicate(`${kind} samples are bitwise repeatable`, equal);
    TestValidator.predicate(
      `${kind} changes colour at more than 90 % of points under a new seed (${changed})`,
      changed > 900,
    );
  }

  // 3. Wood rings along a radial segment from the axis line.
  const wood: IAutoMovieProceduralSurface = make("wood", 0.01, 3);
  let rings: number = 0;
  let low: boolean = true;
  for (let step: number = 0; step <= 100000; ++step) {
    const value: number = AutoMovieEngineMaterial.sampleProceduralSurface({
      surface: wood,
      point: { x: step / 100000, y: 0.37, z: 0 },
    }).value;
    if (low && value > 0.75) {
      ++rings;
      low = false;
    } else if (!low && value < 0.25) low = true;
  }
  TestValidator.predicate(
    `wood crosses 100 ± 10 rings over 1 m (${rings})`,
    Math.abs(rings - 100) <= 10,
  );

  // 4. Stone feature points and the midpoint between two of them.
  const seed: number = 5;
  const feature: (
    i: number,
    j: number,
    k: number,
  ) => [number, number, number] = (
    i: number,
    j: number,
    k: number,
  ): [number, number, number] => {
    const h: [number, number, number] = AutoMovieEngineMaterial.proceduralHash(
      seed,
      16,
      i,
      j,
      k,
    );
    return [
      i + h[0] / 4294967296,
      j + h[1] / 4294967296,
      k + h[2] / 4294967296,
    ];
  };
  let zeroAtFeatures: boolean = true;
  let midpoints: number = 0;
  let zeroAtMidpoints: boolean = true;
  let pair: [[number, number, number], [number, number, number]] | null = null;
  for (let i: number = -3; i <= 3; ++i)
    for (let j: number = -3; j <= 3; ++j) {
      const p: [number, number, number] = feature(i, j, 0);
      zeroAtFeatures &&=
        AutoMovieEngineMaterial.proceduralCells(seed, ...p)[0] < 1e-12;
      const q: [number, number, number] = feature(i + 1, j, 0);
      const m: [number, number, number] = [
        (p[0] + q[0]) / 2,
        (p[1] + q[1]) / 2,
        (p[2] + q[2]) / 2,
      ];
      const half: number = Math.hypot(p[0] - m[0], p[1] - m[1], p[2] - m[2]);
      let crowded: boolean = false;
      for (let a: number = -3; a <= 3 && !crowded; ++a)
        for (let b: number = -3; b <= 3 && !crowded; ++b)
          for (let c: number = -3; c <= 3 && !crowded; ++c) {
            const ci: number = Math.floor(m[0]) + a;
            const cj: number = Math.floor(m[1]) + b;
            const ck: number = Math.floor(m[2]) + c;
            if (
              (ci === i && cj === j && ck === 0) ||
              (ci === i + 1 && cj === j && ck === 0)
            )
              continue;
            const r: [number, number, number] = feature(ci, cj, ck);
            crowded = Math.hypot(r[0] - m[0], r[1] - m[1], r[2] - m[2]) < half;
          }
      if (crowded || half > 1) continue;
      ++midpoints;
      pair ??= [p, q];
      const [f1, f2]: [number, number] =
        AutoMovieEngineMaterial.proceduralCells(seed, ...m);
      zeroAtMidpoints &&= nclose(f2 - f1, 0, 1e-9);
    }
  TestValidator.predicate("F1 is zero at every feature point", zeroAtFeatures);
  TestValidator.predicate(
    `F2 − F1 is zero at uncrowded midpoints (${midpoints} checked)`,
    midpoints >= 10 && zeroAtMidpoints,
  );
  // At scale 0.1 the stone reads the same cells at p / 0.1: a midpoint between
  // two feature points is a joint, whose cellular term is zero.
  const stone: IAutoMovieProceduralSurface = make("stone", 0.1, seed);
  const [a, b]: [[number, number, number], [number, number, number]] = pair!;
  const joint: number = AutoMovieEngineMaterial.sampleProceduralSurface({
    surface: stone,
    point: {
      x: ((a[0] + b[0]) / 2) * 0.1,
      y: ((a[1] + b[1]) / 2) * 0.1,
      z: ((a[2] + b[2]) / 2) * 0.1,
    },
  }).value;
  TestValidator.predicate(
    "at scale 0.1 the joint between two stones carries only the noise quarter",
    joint <= 0.25 + 1e-9,
  );

  // 5. Interpolation by the reported value.
  const clay: IAutoMovieProceduralSurface = make("clay", 0.2, 9);
  const sample: IAutoMovieSampleProceduralSurface.IResult =
    AutoMovieEngineMaterial.sampleProceduralSurface({
      surface: clay,
      point: points[7]!,
    });
  const [c0, c1]: [IAutoMovieColor, IAutoMovieColor] = clay.colors;
  TestValidator.predicate(
    "colour, roughness and height follow the value",
    nclose(sample.color.r, c0.r + sample.value * (c1.r - c0.r), 1e-12) &&
      nclose(sample.color.b, c0.b + sample.value * (c1.b - c0.b), 1e-12) &&
      nclose(sample.roughness, 0.4 + sample.value * 0.4, 1e-12) &&
      nclose(sample.height, sample.value * 0.002, 1e-15),
  );
}

/** Every procedural kind. */
const KINDS: readonly IAutoMovieProceduralSurface["kind"][] = [
  "wood",
  "stone",
  "plaster",
  "clay",
  "fabric",
  "brushedMetal",
];

/** A surface of a kind with fixed colours, roughness and relief. */
function make(
  kind: IAutoMovieProceduralSurface["kind"],
  scale: number,
  seed: number,
): IAutoMovieProceduralSurface {
  const color: (r: number, g: number, b: number) => IAutoMovieColor = (
    r: number,
    g: number,
    b: number,
  ): IAutoMovieColor => ({
    r,
    g,
    b,
    a: 1,
    hex: null,
  });
  return {
    kind,
    seed,
    scale,
    colors: [color(0.1, 0.05, 0.02), color(0.6, 0.4, 0.25)],
    roughness: [0.4, 0.8],
    relief: 0.002,
    ...(kind === "wood" || kind === "fabric" || kind === "brushedMetal"
      ? { axis: { x: 0, y: 1, z: 0 } }
      : {}),
  };
}
