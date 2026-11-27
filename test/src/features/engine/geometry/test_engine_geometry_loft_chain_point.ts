import { AutoMovieEngineLoftChain } from "@automovie/engine";
import type {
  IAutoMovieLoftChain,
  IAutoMovieLoftSectionFrame,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

type V3 = [number, number, number];

/**
 * `AutoMovieEngineLoftChain.point(chain, s, t)` reads a spline chain's point exactly
 * as the station's whole sampler (`AutoMovieEngineLoftChain.sampler(chain, s)`) does,
 * bit for bit.
 *
 * Fixture: made spline chains of order 16 over layers at 0, 40, 95, 150 and 200
 * mm, their numbers from a fixed linear congruential sequence: cubic (no
 * station curvatures, level layers), quintic (curvatures and moving planes with
 * their station derivatives), lifted on every layer with lift curvatures, and
 * lifted on odd layers only.
 *
 * Scenarios:
 *
 * 1. At 23 stations (the layers, between them and both ends) and 19 phases
 *    (negative, past a turn, on and between controls), read twice, every
 *    coordinate of `point` is `Object.is` the sampler's.
 * 2. The quintic chain with one control of layer 2 moved by 1e-9 mm reads a
 *    different point beside that layer.
 */
export function test_engine_geometry_loft_chain_point(): void {
  const made = (
    name: string,
    quintic: boolean,
    lift: "none" | "all" | "some",
  ): IAutoMovieLoftChain => {
    const N: number = 16;
    let state: number = 12345 + name.length * 977;
    const next = (): number => {
      state = (state * 1103515245 + 12345) % 2147483648;
      return state / 2147483648;
    };
    const row = (scale: number): number[] =>
      Array.from({ length: 2 * N }, (): number => (next() - 0.5) * scale);
    const half = (scale: number): number[] =>
      Array.from({ length: N }, (): number => (next() - 0.5) * scale);
    const ring = (radius: number): number[] =>
      Array.from({ length: 2 * N }, (_: unknown, k: number): number => {
        const phi: number = (2 * Math.PI * (k % N)) / N;
        return (
          (k < N ? radius * Math.cos(phi) : radius * Math.sin(phi)) +
          (next() - 0.5) * 2
        );
      });
    const tilt = (y: number): IAutoMovieLoftSectionFrame => {
      const a: number = 0.1 * next();
      return {
        origin: [next(), y, next()],
        u: [Math.cos(a), Math.sin(a), 0],
        v: [0, 0, 1],
      };
    };
    const delta = (scale: number): IAutoMovieLoftSectionFrame => ({
      origin: [(next() - 0.5) * scale, 1, (next() - 0.5) * scale],
      u: [(next() - 0.5) * scale, (next() - 0.5) * scale, 0],
      v: [0, 0, 0],
    });
    const layers: IAutoMovieLoftChain.ILayer[] = [0, 40, 95, 150, 200].map(
      (y: number, i: number): IAutoMovieLoftChain.ILayer => {
        const lifted: boolean =
          lift === "all" || (lift === "some" && i % 2 === 1);
        return {
          y,
          coefficients: ring(40 + 5 * i),
          slopes: row(0.2),
          ...(quintic
            ? {
                curvatures: row(0.01),
                frame: tilt(y),
                frameSlopes: delta(0.01),
                frameCurvatures: delta(0.001),
              }
            : {}),
          ...(lifted
            ? {
                lift: half(3),
                liftSlopes: half(0.05),
                ...(lift === "all" ? { liftCurvatures: half(0.002) } : {}),
              }
            : {}),
        };
      },
    );
    return {
      name,
      basis: "spline",
      order: N,
      rule: "polar",
      samples: N,
      layers,
    };
  };
  const same = (a: V3, b: V3): boolean =>
    a.every((x: number, k: number): boolean => Object.is(x, b[k]));
  const chains: IAutoMovieLoftChain[] = [
    made("cubic", false, "none"),
    made("quintic", true, "none"),
    made("lifted", true, "all"),
    made("partly lifted", false, "some"),
  ];
  const stations: number[] = Array.from(
    { length: 23 },
    (_: unknown, k: number): number => (k * 200) / 22,
  );
  const phases: number[] = [
    -1.3,
    -0.2,
    0,
    0.05,
    0.3927,
    0.7,
    1,
    1.5,
    2,
    2.5,
    Math.PI,
    3.5,
    4,
    4.5,
    5,
    5.5,
    6,
    2 * Math.PI,
    7.1,
  ];

  // 1.
  for (const chain of chains)
    for (const pass of ["fresh", "again"])
      for (const s of stations) {
        const whole: (t: number) => V3 = AutoMovieEngineLoftChain.sampler(chain, s);
        TestValidator.predicate(
          `${chain.name} ${pass} ${s}`,
          phases.every((t: number): boolean =>
            same(AutoMovieEngineLoftChain.point(chain, s, t), whole(t)),
          ),
        );
      }

  // 2.
  const original: IAutoMovieLoftChain = chains[1]!;
  const moved: IAutoMovieLoftChain = structuredClone(original);
  moved.layers[2]!.coefficients[5] = moved.layers[2]!.coefficients[5]! + 1e-9;
  const s: number = (moved.layers[2]!.y + moved.layers[3]!.y) / 2;
  const t: number = (2 * Math.PI * 5.5) / original.order;
  TestValidator.predicate(
    "one control off",
    !same(
      AutoMovieEngineLoftChain.point(moved, s, t),
      AutoMovieEngineLoftChain.sampler(original, s)(t),
    ),
  );
}
