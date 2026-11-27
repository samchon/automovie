import { AutoMovieEngineMaterial } from "@automovie/engine";
import type {
  IAutoMovieColor,
  IAutoMovieProceduralSurface,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Every procedural kind spreads its pattern value over [0, 1] the way its
 * definition says, and the gradient noise beneath them is zero on the lattice
 * and continuous across it.
 *
 * Scenarios:
 *
 * 1. Over 4096 fixed points at many feature sizes, every kind's value stays within
 *    [0, 1], with a mean within [0.25, 0.75] and a standard deviation above
 *    0.05, so no kind is constant or saturated.
 * 2. The gradient noise is zero at every lattice corner, so plaster samples
 *    exactly 0.5 at every point whose coordinates are integer multiples of its
 *    scale.
 * 3. The noise is continuous across a cell face: values a hair on either side of
 *    `x = 3` agree within 1e-6, and the fractal sum stays within [-1, 1].
 * 4. Fabric weaves: at the centre of crossing `(i, j)` with `i + j` even the warp
 *    lies on top and the value is the warp thread's jittered full height, at
 *    least 0.8; with `i + j` odd the weft is on top, also at least 0.8; at a
 *    corner of a crossing, where both thread profiles vanish, the value is 0.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Samples every kind and the noise directly; a pattern that saturated, a noise that was not zero on its lattice, a fade that broke continuity or a weave whose top thread did not alternate fails.
 * @evidence contracts/development/testing.md#independent-expectations Zero at lattice corners and continuity follow from Perlin's construction; the weave's top-thread heights follow from the squared-sine profile and the 0.8 to 1 jitter the contract defines; the value-spread bounds only require a non-degenerate pattern and are far from any tuned value.
 * @evidence contracts/development/testing.md#distinguishing-cases Even and odd crossings and the gap between threads distinguish the over-under rule; determinism and seed sensitivity are owned by `test_material_procedural_sample`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_material_procedural_statistics`, with in-memory inputs only.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_material_procedural_statistics(): void {
  // 1. Spread of every kind.
  for (const kind of KINDS) {
    const surface: IAutoMovieProceduralSurface = make(kind, 0.03);
    const values: number[] = Array.from(
      { length: 4096 },
      (_: unknown, index: number): number =>
        AutoMovieEngineMaterial.sampleProceduralSurface({
          surface,
          point: {
            x: ((index * 0.6180339887) % 1) * 1.7,
            y: ((index * 0.7548776662) % 1) * 1.3,
            z: ((index * 0.569840291) % 1) * 0.9,
          },
        }).value,
    );
    const mean: number =
      values.reduce((a: number, b: number) => a + b, 0) / values.length;
    const deviation: number = Math.sqrt(
      values.reduce((a: number, b: number) => a + (b - mean) ** 2, 0) /
        values.length,
    );
    TestValidator.predicate(
      `${kind} spreads over [0, 1] (mean ${mean.toFixed(3)}, deviation ${deviation.toFixed(3)})`,
      values.every((v: number): boolean => v >= 0 && v <= 1) &&
        mean >= 0.25 &&
        mean <= 0.75 &&
        deviation > 0.05,
    );
  }

  // 2. Zero noise on the lattice.
  const plaster: IAutoMovieProceduralSurface = make("plaster", 0.25);
  let lattice: boolean = true;
  for (let i: number = -4; i <= 4; ++i)
    for (let j: number = -4; j <= 4; ++j)
      lattice &&=
        AutoMovieEngineMaterial.sampleProceduralSurface({
          surface: plaster,
          point: { x: i * 0.25, y: j * 0.25, z: (i - j) * 0.25 },
        }).value === 0.5;
  TestValidator.predicate("plaster is 0.5 on its lattice", lattice);

  // 3. Continuity across a cell face and the fractal bound.
  TestValidator.predicate(
    "noise is continuous across a cell face",
    nclose(
      AutoMovieEngineMaterial.proceduralNoise(4, 1, 3 - 1e-9, 0.37, 0.81),
      AutoMovieEngineMaterial.proceduralNoise(4, 1, 3 + 1e-9, 0.37, 0.81),
      1e-6,
    ),
  );
  let bounded: boolean = true;
  for (let index: number = 0; index < 2000; ++index) {
    const value: number = AutoMovieEngineMaterial.proceduralFractal(
      8,
      index * 0.173,
      index * 0.031,
      -index * 0.057,
    );
    bounded &&= value >= -1 && value <= 1;
  }
  TestValidator.predicate("the fractal sum stays within [-1, 1]", bounded);

  // 4. Fabric over and under; axis Y, so along = y and across = normalize(Y × Z) = X.
  const fabric: IAutoMovieProceduralSurface = make("fabric", 0.01);
  const at: (b: number, a: number) => number = (b: number, a: number): number =>
    AutoMovieEngineMaterial.sampleProceduralSurface({
      surface: fabric,
      point: { x: b * 0.01, y: a * 0.01, z: 0 },
    }).value;
  TestValidator.predicate(
    "the top thread alternates by crossing parity and both vanish between threads",
    at(2.5, 4.5) >= 0.8 && at(3.5, 4.5) >= 0.8 && nclose(at(3, 4), 0, 1e-12),
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
): IAutoMovieProceduralSurface {
  const color: (value: number) => IAutoMovieColor = (
    value: number,
  ): IAutoMovieColor => ({
    r: value,
    g: value,
    b: value,
    a: 1,
    hex: null,
  });
  return {
    kind,
    seed: 21,
    scale,
    colors: [color(0.1), color(0.7)],
    roughness: { atZero: 0.3, atOne: 0.9 },
    relief: 0.001,
    ...(kind === "wood" || kind === "fabric" || kind === "brushedMetal"
      ? { axis: { x: 0, y: 1, z: 0 } }
      : {}),
  };
}
