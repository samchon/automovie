import {
  createAutoMovieRandom,
  deriveAutoMovieSeed,
  seededSmoothNoise,
  warpRoot,
} from "@automovie/engine";
import type { IAutoMovieTransform } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Windowed noise vanishes smoothly at its window's ends and repeats from its
 * seed; a root warp reaches its displacement at its event without a jump.
 *
 * Scenarios:
 * 1. Noise from a stream keyed by (film seed, subject, channel) is zero at
 *    u = 0 and u = 1, and its first and second finite differences shrink to
 *    zero there faster than the step (the window's derivatives vanish).
 * 2. The same stream gives the same value twice; another channel's stream
 *    gives a different signal; the signal stays within [-sqrt(4), sqrt(4)].
 * 3. A warp of (0.3, 0, -0.2) m and 30° over [0.5, 1.5] s leaves the root
 *    untouched before 0.5 s, reaches the full displacement and turn at 1.5 s
 *    and after, and has zero rate at both window ends.
 * 4. A window that does not move forward throws.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Evaluates the public noise and warp; a window without vanishing derivatives, a stream not keyed by its ids, or a warp profile with a velocity step fails.
 * @evidence contracts/development/testing.md#independent-expectations The window (16u^2(1-u)^2)^2 has a fourth-order zero at both ends, so values and differences near the ends scale as the step to the fourth; a sum of 4 sines over sqrt(4) is bounded by 2; the warp's endpoints are its declared displacement.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers both window ends, the middle, equal and different streams, the warp before, inside and after its window and an invalid window.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 scenarios and what each pins.
 */
export function test_motion_noise_warp(): void {
  const seed: string = deriveAutoMovieSeed("film", "a", "jab", "path");
  const a = createAutoMovieRandom(seed);
  const n = (u: number): number => seededSmoothNoise(a, u, 0.8, 3);
  TestValidator.predicate("zero at ends", n(0) === 0 && n(1) === 0);
  for (const h of [1e-2, 1e-3]) {
    const near: number = Math.max(Math.abs(n(h)), Math.abs(n(1 - h)));
    TestValidator.predicate(
      `fourth-order zero at the ends (${h})`,
      near <= 2 * 256 * h ** 4,
    );
  }
  TestValidator.equals("repeatable", n(0.37), n(0.37));
  const other = createAutoMovieRandom(
    deriveAutoMovieSeed("film", "a", "jab", "guard"),
  );
  TestValidator.predicate(
    "other channel differs",
    seededSmoothNoise(other, 0.37, 0.8, 3) !== n(0.37),
  );
  let bounded: boolean = true;
  for (let u: number = 0; u <= 1; u += 0.001)
    if (Math.abs(n(u)) > 2 + 1e-12) bounded = false;
  TestValidator.predicate("bounded", bounded);

  const root: IAutoMovieTransform = {
    translation: { x: 1, y: 0, z: 2 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
  const warp: warpRoot.IWarp = {
    translation: { x: 0.3, y: 0, z: -0.2 },
    yaw: 30,
    start: 0.5,
    end: 1.5,
  };
  const at = (s: number): IAutoMovieTransform => warpRoot(root, warp, s);
  TestValidator.predicate(
    "before untouched",
    at(0.2).translation.x === 1 && at(0.2).rotation.w === 1,
  );
  const done: IAutoMovieTransform = at(1.5);
  TestValidator.predicate(
    "full displacement at the event",
    Math.abs(done.translation.x - 1.3) < 1e-12 &&
      Math.abs(done.translation.z - 1.8) < 1e-12 &&
      Math.abs(2 * Math.asin(done.rotation.y) - Math.PI / 6) < 1e-12 &&
      at(3).translation.x === done.translation.x,
  );
  const h: number = 1e-5;
  TestValidator.predicate(
    "zero rate at window ends",
    Math.abs(at(0.5 + h).translation.x - at(0.5).translation.x) / h < 1e-6 &&
      Math.abs(at(1.5).translation.x - at(1.5 - h).translation.x) / h < 1e-6,
  );
  TestValidator.error("backward window", (): unknown =>
    warpRoot(root, { ...warp, end: 0.5 }, 1),
  );
}
