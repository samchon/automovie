import {
  createAutoMovieRandom,
  deriveAutoMovieSeed,
  seededSmoothNoise,
  warpRoot,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanSkill,
  IAutoMovieRandom,
  IAutoMovieTransform,
  IAutoMovieWarpRoot,
} from "@automovie/interface";
import { HumanSkill } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../../features/internal/nclose";
import { throwsError } from "../../../../features/internal/throwsError";

/**
 * Smooth seeded motion variation is bounded, continuous and replayable.
 *
 * Scenarios:
 * 1. Compare the interior observation and boundary state with the prescribed continuous law.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Smooth seeded motion variation is bounded, continuous and replayable. Observes the signed variations of successive positive step durations.
 * @evidence contracts/development/testing.md#independent-expectations Four sinusoidal terms each contribute at most one half; the contact window has zero height at each end. A replay repeats every variation. A different seed changes the relative durations, even after removing the mean.
 * @evidence contracts/development/testing.md#distinguishing-cases Boundary and interior inputs distinguish the two behaviors. Changing a global tempo offset cannot change a sequence of centred deviations.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory. Calls the skill and its public indexed random stream directly.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation. Describes what is replayed.
 */
export function test_motion_dynamics_random_warp(): void {
  tempoDispersion();
  const draws: number[] = [];
  const stream: IAutoMovieRandom = {
    ...createAutoMovieRandom(deriveAutoMovieSeed("spectrum")),
    float(i: number): number {
      draws.push(i);
      return i / 8;
    },
  };
  const reader = seededSmoothNoise.prepare(stream, 1.25, 2);
  TestValidator.predicate(
    "inactive noise never requests the spectrum",
    [-1, 0, 1, 2, NaN].every((u) => reader(u) === 0) && draws.length === 0,
  );
  for (const u of [0.25, 0.75, 0.25]) {
    const value =
      128 *
      u ** 4 *
      (1 - u) ** 4 *
      [
        1.5 * u + 0.25,
        2.375 * u + 0.75,
        3.25 * u + 1.25,
        4.125 * u + 1.75,
      ].reduce((sum, phase) => sum + Math.sin(Math.PI * phase), 0);
    TestValidator.predicate(
      "four indexed frequencies under a quartic window",
      nclose(reader(u), value, 1e-12),
    );
  }
  TestValidator.equals(
    "preparation draws once on demand",
    draws,
    [0, 1, 2, 3, 4, 5, 6, 7],
  );
  const singleton = seededSmoothNoise.prepare(stream, 1.25, 2, 1);
  const u = 0.25;
  TestValidator.predicate(
    "one term carries its own window",
    nclose(
      singleton(u),
      256 * u ** 4 * (1 - u) ** 4 * Math.sin(Math.PI * (1.5 * u + 0.25)),
      1e-12,
    ),
  );
  for (const [duration, frequency, terms] of [
    [0, 2, 4],
    [1, -2, 4],
    [1, 2, 0],
    [1, 2, 1.5],
  ] as const)
    TestValidator.predicate(
      "invalid spectrum refused even at an endpoint",
      throwsError(() =>
        seededSmoothNoise.prepare(stream, duration, frequency, terms)(0),
      ),
    );
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
  const moved = (t: number): IAutoMovieTransform => warpRoot(root, warp, t);
  const end = moved(warp.end);
  TestValidator.predicate(
    "rigid shift and thirty-degree yaw at the event",
    nclose(end.translation.x, 1.3, 1e-12) &&
      nclose(end.translation.z, 1.8, 1e-12) &&
      nclose(2 * Math.asin(end.rotation.y), Math.PI / 6, 1e-12),
  );
  const h = 1e-5;
  TestValidator.predicate(
    "stationary endpoints of window",
    moved(0).translation.x === 1 &&
      moved(3).translation.x === end.translation.x &&
      Math.abs(moved(warp.start + h).translation.x - 1) / h < 1e-6 &&
      Math.abs(moved(warp.end - h).translation.x - end.translation.x) / h <
        1e-6,
  );
  TestValidator.predicate(
    "positive window",
    throwsError(() => warpRoot(root, { ...warp, end: warp.start }, 1)),
  );
  const at = (seed: string, time: number): number =>
    seededSmoothNoise(
      createAutoMovieRandom(
        deriveAutoMovieSeed(seed, "walker", "walk", "tempo"),
      ),
      time,
      0.8,
      3,
    );
  const samples: number[] = ["a", "b", "c", "d"].map((seed: string): number =>
    at(seed, 0.5),
  );
  TestValidator.predicate(
    "bounded distinct streams",
    samples.every((v: number): boolean => Math.abs(v) <= 2) &&
      new Set(samples).size === samples.length,
  );
  TestValidator.predicate(
    "repeatable and continuous",
    nclose(at("a", 0.5), samples[0]!, 0) &&
      Math.abs(at("a", 0.5 + 1e-7) - samples[0]!) < 1e-4,
  );
  TestValidator.predicate(
    "zero at both boundaries",
    at("a", 0) === 0 && at("a", 1) === 0,
  );
}
/**
 * A performer's tempo variation replays from the seed and the step identity.
 *
 * Scenarios:
 * 1. Repeat and change a seed across four half-second steps.
 *
 */
function tempoDispersion(): void {
  const steps = (seed: string): number[] => {
    const skill: IAutoMovieMotionHumanSkill = HumanSkill.resolve(
      { level: "trained" },
      seed,
    );
    return [0, 1, 2, 3].map((index: number): number =>
      HumanSkill.jitter(
        skill,
        HumanSkill.stream(skill, "walker", "walk", index, "tempo"),
        0.5,
      ),
    );
  };
  const first: number[] = steps("first");
  const second: number[] = steps("second");
  TestValidator.equals("replayed step times", steps("first"), first);
  TestValidator.predicate(
    "positive durations",
    [...first, ...second].every((duration: number): boolean => duration > 0),
  );
  const spread = (times: number[]): number =>
    Math.max(...times) - Math.min(...times);
  TestValidator.predicate(
    "seed changes dispersion",
    spread(first) > 0 && !nclose(spread(first), spread(second), 1e-9),
  );
}
