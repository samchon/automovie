import type { IAutoMovieVector3 } from "@automovie/interface";
import type { HumanPerformance, IHumanBody } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { photographScene } from "../internal/photographScene";

/**
 * In the lexicon's `photograph` row the camera rides the hand that holds
 * it: the right hand took it up by its grip, and the left hand that takes
 * its far end at the eye steadies it without taking it over, so the camera
 * neither jumps to the left hand when that hand closes nor back when it
 * lets go.
 *
 * Scenarios, on the average man:
 * 1. Sampled every 1/120 s through the whole film, the camera's point
 *    departs from the middle of its two neighbours by no more than 5 mm.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the scene through the public chain and reads the displayed camera; a second hand that took the camera over moves it by the hands' gap at the instant it closes and again when it opens, which fails with the instant.
 * @evidence contracts/development/testing.md#independent-expectations The 5 mm is the verdict report's continuity bound for any displayed point; nothing is read from the carrying rule.
 * @evidence contracts/development/testing.md#distinguishing-cases One prop held by one hand and steadied by the other; a handover between two people, where the later grip carries, is the handover spec's.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and one archetype and reads one short film; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, what a takeover would do and the scenario.
 */
export function test_human_motion_hand_verdicts_photograph_camera(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const performance: HumanPerformance = photographScene(body);
  const step: number = 1 / 120;
  const path: IAutoMovieVector3[] = Array.from(
    { length: Math.floor(performance.duration / step) + 1 },
    (_: unknown, k: number): IAutoMovieVector3 =>
      performance.prop("camera", k * step).position,
  );
  let worst: { value: number; seconds: number } = { value: 0, seconds: 0 };
  for (let k: number = 1; k + 1 < path.length; k++) {
    const before: IAutoMovieVector3 = path[k - 1]!;
    const now: IAutoMovieVector3 = path[k]!;
    const after: IAutoMovieVector3 = path[k + 1]!;
    const departs: number = Math.hypot(
      now.x - before.x - (after.x - before.x) / 2,
      now.y - before.y - (after.y - before.y) / 2,
      now.z - before.z - (after.z - before.z) / 2,
    );
    if (departs > worst.value) worst = { value: departs, seconds: k * step };
  }
  TestValidator.equals(
    "the camera rides its hand",
    worst.value <= 0.005
      ? "no step"
      : `a ${(worst.value * 1000).toFixed(1)} mm step at ${worst.seconds.toFixed(3)} s`,
    "no step",
  );
}
