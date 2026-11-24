import {
  createAutoMovieFractalNoise2,
  createAutoMovieFractalNoise3,
  createAutoMovieGradientNoise2,
  createAutoMovieGradientNoise3,
  deriveAutoMovieSeed,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { makeRng } from "../internal/makeRng";
import { namedFacts, nclose, throwsError } from "../internal/predicates";

/** One noise sampler, either dimension, taking a point as an array. */
type Sampler = (point: readonly number[]) => number;

/**
 * Seeded gradient noise in two and three dimensions, and its fractal sum, is
 * deterministic, bounded, scaled to its bound, normalized, zero on the lattice,
 * continuous, aperiodic over 256 cells, defined for negative coordinates, and
 * refuses inputs by name.
 *
 * Scenarios:
 *
 * 1. The same seed and point repeat the value; a second seed differs at every
 *    point of a 16 by 16 off-lattice grid.
 * 2. Over 10,000 seeded points in [-1000, 1000], single-octave and 4-octave
 *    fractal values lie strictly inside (-1, 1), so the clamp that absorbs
 *    rounding never engages.
 * 3. Single-octave values at 1,000 integer lattice points are exactly zero.
 * 4. At 1,000 seeded points, a 1e-6 step in a seeded direction changes
 *    single-octave and fractal values by under 1e-4.
 * 5. At x = 0.5 + 3k, k = 0 .. 63, y = 0.3 (z = 0.7), the mean |n(x + 256) - n(x)|
 *    exceeds 0.1.
 * 6. At 1,000 points in [-50, 50] values stay in [-1, 1], and steps across every
 *    coordinate plane through zero are continuous.
 * 7. A non-finite coordinate, a coordinate one cell past the bound, octaves 0 or
 *    2.5, and roughness 0 or 1 throw naming the parameter; a coordinate on the
 *    bound is accepted.
 * 8. At 100 seeded integer lattice points, the single-octave value's slope, read
 *    by a central difference of 1e-5 cells, is sqrt(2) in two dimensions and 2
 *    / sqrt(3) in three, within 1e-6.
 * 9. At 1,000 seeded points on the half-cell lattice, the 4-octave fractal value
 *    times 1 + 0.5 + 0.25 + 0.125 equals the single-octave value within 1e-12.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public engine noise samplers and observes their values: repetition, seed sensitivity, the strict range, lattice zeros, step continuity, the 256-cell difference, the named refusals, the lattice slope and the half-cell fractal sum. The lattice slope catches a missing or wrong sqrt(2) or 2 / sqrt(3) output scale and the half-cell sum a missing or wrong amplitude normalization; the range alone catches neither, because every sampler clamps to [-1, 1] and an unnormalized three-dimensional sum of these octaves stays inside it. The others catch a table-driven period, a non-interpolating blend, a signed-index failure and silent acceptance of bad parameters.
 * @evidence contracts/development/testing.md#independent-expectations The range [-1, 1], zeros on the lattice, the octave and roughness domains and the domain bounds 2^25 and 2^16 are the documented contract; 1e-4 per 1e-6 step allows a slope of 100 lattice units, far above any quintic-blended unit-gradient octave sum of four; 0.1 mean difference over 64 off-lattice points separates an aperiodic lattice from a 256-periodic table, which gives zero. Every fade weight has zero slope at a lattice corner, so the slope there is the corner's unit gradient times the output scale, the reciprocal of the documented bounds sqrt(2) / 2 and sqrt(3) / 2; the 1e-6 tolerance lies far above the difference's truncation, about 10 (1e-5)^2 per axis. On the half-cell lattice every octave after the first samples its own lattice, where it is zero, so the documented sum is the first octave, the seed's own noise, over the amplitudes 1 + 0.5 + 0.25 + 0.125; 1e-12 bounds rounding only.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers both dimensions, single and fractal forms, positive and negative coordinates, points on and across the zero planes, lattice corners and half-cell points, the bound and one cell past it, and each refused parameter; terrain and rock consumers own their own shapes.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous unit over in-memory numbers; it starts no host, file or renderer.
 * @evidence contracts/development/common.md#meaningful-documentation Lists its nine scenarios with the input and expected behavior of each.
 */
export function test_engine_gradient_noise(): void {
  const seed: string = deriveAutoMovieSeed("noise", "a");
  const other: string = deriveAutoMovieSeed("noise", "b");
  const noise2: (x: number, y: number) => number =
    createAutoMovieGradientNoise2(seed);
  const noise3: (x: number, y: number, z: number) => number =
    createAutoMovieGradientNoise3(seed);
  const fractal2: (x: number, y: number) => number =
    createAutoMovieFractalNoise2(seed, 4, 0.5);
  const fractal3: (x: number, y: number, z: number) => number =
    createAutoMovieFractalNoise3(seed, 4, 0.5);
  const samplers: Record<string, [Sampler, number]> = {
    noise2: [(p: readonly number[]): number => noise2(p[0]!, p[1]!), 2],
    noise3: [(p: readonly number[]): number => noise3(p[0]!, p[1]!, p[2]!), 3],
    fractal2: [(p: readonly number[]): number => fractal2(p[0]!, p[1]!), 2],
    fractal3: [
      (p: readonly number[]): number => fractal3(p[0]!, p[1]!, p[2]!),
      3,
    ],
  };
  const rng: () => number = makeRng(4058);
  const point: (dimension: number, half: number) => number[] = (
    dimension: number,
    half: number,
  ): number[] =>
    Array.from({ length: dimension }, (): number => (rng() * 2 - 1) * half);
  const everySampler: (
    test: (sample: Sampler, dimension: number) => boolean,
  ) => boolean = (
    test: (sample: Sampler, dimension: number) => boolean,
  ): boolean =>
    Object.values(samplers).every(([sample, dimension]: [Sampler, number]) =>
      test(sample, dimension),
    );

  // 4 and 6. A 1e-6 step in a seeded direction from each point, or across
  // the zero plane of every axis, changes the value by under 1e-4.
  const continuous: (
    sample: Sampler,
    dimension: number,
    from: () => number[],
  ) => boolean = (
    sample: Sampler,
    dimension: number,
    from: () => number[],
  ): boolean =>
    Array.from({ length: 1_000 }).every((): boolean => {
      const p: number[] = from();
      const d: number[] = point(dimension, 1);
      const length: number = Math.hypot(...d);
      const q: number[] = p.map(
        (value: number, axis: number): number =>
          value + (1e-6 * d[axis]!) / length,
      );
      return Math.abs(sample(q) - sample(p)) < 1e-4;
    });
  const inRange: (value: number) => boolean = (value: number): boolean =>
    value >= -1 && value <= 1;

  TestValidator.equals(
    "gradient noise is a bounded, smooth, aperiodic function of its seed",
    namedFacts([
      [
        "repeats",
        (): boolean =>
          everySampler((sample: Sampler, dimension: number): boolean => {
            const p: number[] = point(dimension, 100);
            return sample(p) === sample([...p]);
          }) &&
          createAutoMovieGradientNoise2(seed)(3.25, -7.5) ===
            noise2(3.25, -7.5) &&
          createAutoMovieFractalNoise3(seed, 4, 0.5)(1.5, 2.25, -0.75) ===
            fractal3(1.5, 2.25, -0.75),
      ],
      [
        "seedChanges",
        (): boolean => {
          const others: [Sampler, Sampler][] = [
            [
              (p: readonly number[]): number => noise2(p[0]!, p[1]!),
              (
                (n: (x: number, y: number) => number) =>
                (p: readonly number[]): number =>
                  n(p[0]!, p[1]!)
              )(createAutoMovieGradientNoise2(other)),
            ],
            [
              (p: readonly number[]): number => noise3(p[0]!, p[1]!, 0.5),
              (
                (n: (x: number, y: number, z: number) => number) =>
                (p: readonly number[]): number =>
                  n(p[0]!, p[1]!, 0.5)
              )(createAutoMovieGradientNoise3(other)),
            ],
          ];
          return others.every(([a, b]: [Sampler, Sampler]): boolean => {
            for (let i: number = 0; i < 16; ++i)
              for (let j: number = 0; j < 16; ++j) {
                const p: number[] = [i + 0.37, j + 0.61];
                if (a(p) === b(p)) return false;
              }
            return true;
          });
        },
      ],
      [
        "bounded",
        (): boolean =>
          // The clamp to [-1, 1] only absorbs rounding, so no sample may
          // reach it; an unnormalized fractal sum would.
          everySampler((sample: Sampler, dimension: number): boolean =>
            Array.from({ length: 10_000 }).every(
              (): boolean => Math.abs(sample(point(dimension, 1_000))) < 1,
            ),
          ),
      ],
      [
        "zeroOnLattice",
        (): boolean =>
          Array.from({ length: 1_000 }).every((): boolean => {
            const [x, y, z]: number[] = point(3, 1_000).map(Math.round);
            return noise2(x!, y!) === 0 && noise3(x!, y!, z!) === 0;
          }),
      ],
      [
        "continuous",
        (): boolean =>
          everySampler((sample: Sampler, dimension: number): boolean =>
            continuous(sample, dimension, (): number[] =>
              point(dimension, 1_000),
            ),
          ),
      ],
      [
        "aperiodic",
        (): boolean =>
          everySampler((sample: Sampler, dimension: number): boolean => {
            let total: number = 0;
            for (let k: number = 0; k < 64; ++k) {
              const p: number[] = [0.5 + 3 * k, 0.3, 0.7].slice(0, dimension);
              const q: number[] = [p[0]! + 256, ...p.slice(1)];
              total += Math.abs(sample(q) - sample(p));
            }
            return total / 64 > 0.1;
          }),
      ],
      [
        "negative",
        (): boolean =>
          everySampler(
            (sample: Sampler, dimension: number): boolean =>
              Array.from({ length: 1_000 }).every((): boolean =>
                inRange(sample(point(dimension, 50))),
              ) &&
              continuous(sample, dimension, (): number[] => {
                // A point within 1e-6 of every zero plane, so the seeded step
                // crosses each plane in about half of the draws.
                return point(dimension, 1e-6);
              }),
          ),
      ],
      [
        "refusals",
        (): boolean => {
          const b2: number = createAutoMovieGradientNoise2.BOUND;
          const b3: number = createAutoMovieGradientNoise3.BOUND;
          return (
            b2 === 2 ** 25 &&
            b3 === 2 ** 16 &&
            throwsError(() => noise2(Number.NaN, 0), "x") &&
            throwsError(() => noise2(0, Infinity), "y") &&
            throwsError(() => noise3(0, 0, -Infinity), "z") &&
            Number.isFinite(noise2(b2, -b2)) &&
            throwsError(() => noise2(b2 + 1, 0), ["x", String(b2)]) &&
            throwsError(() => noise2(0, -b2 - 1), ["y", String(b2)]) &&
            Number.isFinite(noise3(b3, -b3, b3)) &&
            throwsError(() => noise3(b3 + 1, 0, 0), ["x", String(b3)]) &&
            throwsError(() => noise3(0, -b3 - 1, 0), ["y", String(b3)]) &&
            throwsError(() => noise3(0, 0, b3 + 1), ["z", String(b3)]) &&
            Number.isFinite(fractal2(b2 / 8, -b2 / 8)) &&
            throwsError(() => fractal2(b2 / 8 + 1 / 8, 0), ["x", String(b2)]) &&
            Number.isFinite(fractal3(b3 / 8, -b3 / 8, b3 / 8)) &&
            throwsError(
              () => fractal3(0, 0, b3 / 8 + 1 / 8),
              ["z", String(b3)],
            ) &&
            throwsError(
              () => createAutoMovieFractalNoise2(seed, 0, 0.5),
              ["octaves"],
            ) &&
            throwsError(
              () => createAutoMovieFractalNoise3(seed, 2.5, 0.5),
              ["octaves"],
            ) &&
            throwsError(
              () => createAutoMovieFractalNoise2(seed, 4, 0),
              ["roughness"],
            ) &&
            throwsError(
              () => createAutoMovieFractalNoise3(seed, 4, 1),
              ["roughness"],
            )
          );
        },
      ],
      [
        "scaled",
        (): boolean =>
          (
            [
              [samplers.noise2![0], 2, Math.SQRT2],
              [samplers.noise3![0], 3, 2 / Math.sqrt(3)],
            ] as const
          ).every(
            ([sample, dimension, scale]: readonly [
              Sampler,
              number,
              number,
            ]): boolean =>
              Array.from({ length: 100 }).every((): boolean => {
                // At a lattice corner every fade weight's slope vanishes, so
                // the value's slope is the corner's unit gradient times the
                // output scale; a central difference of 1e-5 cells reads it
                // within about 10 * (1e-5)^2 per axis.
                const corner: number[] = point(dimension, 1_000).map(
                  Math.round,
                );
                const slope: number[] = corner.map(
                  (_: number, axis: number): number => {
                    const step: (sign: number) => number[] = (
                      sign: number,
                    ): number[] =>
                      corner.map(
                        (value: number, at: number): number =>
                          value + (at === axis ? sign * 1e-5 : 0),
                      );
                    return (sample(step(1)) - sample(step(-1))) / 2e-5;
                  },
                );
                return Math.abs(Math.hypot(...slope) - scale) < 1e-6;
              }),
          ),
      ],
      [
        "normalized",
        (): boolean =>
          (
            [
              [samplers.fractal2![0], samplers.noise2![0], 2],
              [samplers.fractal3![0], samplers.noise3![0], 3],
            ] as const
          ).every(
            ([fractal, single, dimension]: readonly [
              Sampler,
              Sampler,
              number,
            ]): boolean =>
              Array.from({ length: 1_000 }).every((): boolean => {
                // On the half-cell lattice every octave from the second on
                // samples its own lattice, where it is zero, so the sum is
                // the first octave, the seed's own noise, over the summed
                // amplitudes 1 + 0.5 + 0.25 + 0.125.
                const p: number[] = point(dimension, 1_000).map(
                  (value: number): number => Math.round(2 * value) / 2,
                );
                return nclose(fractal(p) * 1.875, single(p), 1e-12);
              }),
          ),
      ],
    ]),
    {
      repeats: true,
      seedChanges: true,
      bounded: true,
      zeroOnLattice: true,
      continuous: true,
      aperiodic: true,
      negative: true,
      refusals: true,
      scaled: true,
      normalized: true,
    },
  );
}
