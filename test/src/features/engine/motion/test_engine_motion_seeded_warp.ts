import { AutoMovieEngineRandom, AutoMovieEngineMotionTrajectory, AutoMovieEngineMotionSampling } from "@automovie/engine";

import type {
  IAutoMovieRandom,
  IAutoMovieTransform,
  IAutoMovieWarpRoot,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/** Rounding of a few sines and products. */
const ROUNDING: number = 1e-12;

/**
 * Seeded variation: `seededSmoothNoise` is a sum of sines of indexed
 * frequencies under the quartic window `2⁸ u⁴ (1 − u)⁴ / terms`, its phases and
 * frequencies drawn once on demand from the stream, zero at and outside the
 * window's ends; `warpRoot` shifts and turns a root rigidly over a window by
 * the minimum-jerk share, still at the window's ends.
 *
 * Scenarios:
 *
 * 1. With a stream drawing i / 8 at index i, over 1.25 s at 2 Hz: no read at or
 *    outside the window draws; at u = ¼ and ¾ the value is `128 u⁴ (1 − u)⁴ Σ
 *    sin π (f_k u + φ_k)` with (f, φ) = (1.5, 0.25), (2.375, 0.75), (3.25,
 *    1.25), (4.125, 1.75); the eight draws happen once; one term carries `256
 *    u⁴ (1 − u)⁴`.
 * 2. A duration, frequency or term count that is not positive is refused.
 * 3. Four seeds give four distinct values within ±2, a seed repeats exactly, and
 *    the noise is zero at both ends.
 * 4. A warp of (0.3, 0, −0.2) and 30 degrees over 0.5 to 1.5 s: at its end the
 *    root is at (1.3, 0, 1.8) turned 30 degrees, before it unchanged, after it
 *    held, still at both ends; an empty window is refused.
 */
export function test_engine_motion_seeded_warp(): void {
  // 1. The spectrum.
  const draws: number[] = [];
  const stream: IAutoMovieRandom = {
    ...AutoMovieEngineRandom.createRandom(AutoMovieEngineRandom.deriveSeed("spectrum")),
    float(i: number): number {
      draws.push(i);
      return i / 8;
    },
  };
  const reader: (u: number) => number = AutoMovieEngineMotionSampling.seededSmoothNoisePrepare(
    stream,
    1.25,
    2,
  );
  const quiet: boolean = [-1, 0, 1, 2].every(
    (u: number): boolean => reader(u) === 0,
  );
  const silent: boolean = draws.length === 0;
  const terms: readonly (readonly [number, number])[] = [
    [1.5, 0.25],
    [2.375, 0.75],
    [3.25, 1.25],
    [4.125, 1.75],
  ];
  TestValidator.predicate(
    "four indexed frequencies under a quartic window, drawn once",
    quiet &&
      silent &&
      [0.25, 0.75, 0.25].every((u: number): boolean =>
        nclose(
          reader(u),
          128 *
            u ** 4 *
            (1 - u) ** 4 *
            terms.reduce(
              (sum: number, [f, phase]: readonly [number, number]): number =>
                sum + Math.sin(Math.PI * (f * u + phase)),
              0,
            ),
          ROUNDING,
        ),
      ) &&
      draws.join() === "0,1,2,3,4,5,6,7" &&
      nclose(
        AutoMovieEngineMotionSampling.seededSmoothNoisePrepare(stream, 1.25, 2, 1)(0.25),
        256 * 0.25 ** 4 * 0.75 ** 4 * Math.sin(Math.PI * (1.5 * 0.25 + 0.25)),
        ROUNDING,
      ),
  );

  // 2. Refusals.
  const bad: readonly (readonly [number, number, number])[] = [
    [0, 2, 4],
    [1, -2, 4],
    [1, 2, 0],
  ];
  TestValidator.predicate(
    "an invalid spectrum is refused",
    bad.every(
      ([duration, frequency, count]: readonly [
        number,
        number,
        number,
      ]): boolean =>
        throwsError((): number =>
          AutoMovieEngineMotionSampling.seededSmoothNoisePrepare(stream, duration, frequency, count)(0),
        ),
    ),
  );

  // 3. Seeds.
  const at = (seed: string, u: number): number =>
    AutoMovieEngineMotionSampling.seededSmoothNoise(
      AutoMovieEngineRandom.createRandom(
        AutoMovieEngineRandom.deriveSeed(seed, "walker", "walk", "tempo"),
      ),
      u,
      0.8,
      3,
    );
  const samples: number[] = ["a", "b", "c", "d"].map((seed: string): number =>
    at(seed, 0.5),
  );
  TestValidator.predicate(
    "bounded, distinct, repeatable and zero at the ends",
    samples.every((v: number): boolean => Math.abs(v) <= 2) &&
      new Set(samples).size === samples.length &&
      at("a", 0.5) === samples[0] &&
      at("a", 0) === 0 &&
      at("a", 1) === 0,
  );

  // 4. A root warp.
  const root: IAutoMovieTransform = {
    translation: { x: 1, y: 0, z: 2 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
  const warp: IAutoMovieWarpRoot.IWarp = {
    translation: { x: 0.3, y: 0, z: -0.2 },
    yaw: 30,
    start: 0.5,
    end: 1.5,
  };
  const moved = (t: number): IAutoMovieTransform => AutoMovieEngineMotionTrajectory.warpRoot(root, warp, t);
  const end: IAutoMovieTransform = moved(warp.end);
  const h: number = 1e-5;
  TestValidator.predicate(
    "a rigid shift and turn, still at the window's ends",
    nclose(end.translation.x, 1.3, ROUNDING) &&
      nclose(end.translation.z, 1.8, ROUNDING) &&
      nclose(2 * Math.asin(end.rotation.y), Math.PI / 6, ROUNDING) &&
      moved(0).translation.x === 1 &&
      moved(3).translation.x === end.translation.x &&
      Math.abs(moved(warp.start + h).translation.x - 1) / h < 1e-6 &&
      Math.abs(moved(warp.end - h).translation.x - end.translation.x) / h <
        1e-6 &&
      throwsError(
        (): IAutoMovieTransform =>
          AutoMovieEngineMotionTrajectory.warpRoot(root, { ...warp, end: warp.start }, 1),
      ),
  );
}
