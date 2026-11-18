import {
  createAutoMovieRandom,
  deriveAutoMovieSeed,
  seededSmoothNoise,
} from "@automovie/engine";
import type { IAutoMovieMotionHumanSkill } from "@automovie/interface";
import { HumanSkill } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Smooth seeded motion variation is bounded, continuous and replayable.
 *
 * Scenarios:
 * 1. Compare the interior observation and boundary state with the prescribed continuous law.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Smooth seeded motion variation is bounded, continuous and replayable.
 * @evidence contracts/development/testing.md#independent-expectations Four sinusoidal terms each contribute at most one half; the contact window has zero height at each end.
 * @evidence contracts/development/testing.md#distinguishing-cases Boundary and interior inputs distinguish the two behaviors.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_random_warp(): void {
  tempoDispersion();
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
 * @evidence contracts/development/testing.md#behavioral-verification Observes the signed variations of successive positive step durations.
 * @evidence contracts/development/testing.md#independent-expectations A replay repeats every variation. A different seed changes the relative durations, even after removing the mean.
 * @evidence contracts/development/testing.md#distinguishing-cases Changing a global tempo offset cannot change a sequence of centred deviations.
 * @evidence contracts/development/testing.md#execution-ownership Calls the skill and its public indexed random stream directly.
 * @evidence contracts/development/common.md#meaningful-documentation Describes what is replayed.
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
