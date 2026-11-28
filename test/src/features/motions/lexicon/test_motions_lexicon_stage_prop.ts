import {
  humanStagePropBeat
} from "../../../../../packages/motions/src/lexicon/internal/humanStagePropBeat";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * The `HumanStageProp` law's beats (`humanStagePropBeat`): each beat's mark,
 * seconds, trunk turn, footing and silhouette over its span (authored screen
 * blocking; the qiangshu flourishes after the International Wushu Federation's
 * Taolu).
 *
 * Scenarios:
 *
 * 1. A figure eight marks the tip over 1.8 s, steps, and a quarter through it
 *    holds the grip 0.21 arms aside at its lowest, `-0.12`, the axis along +X.
 * 2. A shield block marks the face over 1.05 s without a step and ends 0.18 arms
 *    across, 0.53 ahead.
 * 3. The offset and linked displays share one silhouette.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines authored stage-prop beats through marker, duration, support and linked or offset graphic display.
 * @evidence contracts/development/testing.md#behavioral-verification Samples a figure-eight and a shield beat at fixed phases and compares both representations of the same display.
 * @evidence contracts/development/testing.md#independent-expectations Authored times 1.8 s and 1.05 s distinguish the beats. The fixed poses and axes define their silhouettes and only the figure-eight schedules a step.
 */
export function test_motions_lexicon_stage_prop(): void {
  const eight: humanStagePropBeat.IBeat = humanStagePropBeat("figureEight");
  const quarter: humanStagePropBeat.IPose = eight.sample(0.25);
  TestValidator.predicate(
    "the figure eight",
    eight.mark === "tip" &&
      eight.seconds === 1.8 &&
      eight.advance === "step" &&
      nclose(quarter.grip[0], 0.21, 1e-12) &&
      nclose(quarter.grip[1], -0.12, 1e-12) &&
      nclose(quarter.axis[0], 0.7, 1e-12) &&
      nclose(quarter.axis[2], 0, 1e-12),
  );
  const block: humanStagePropBeat.IBeat = humanStagePropBeat("block");
  TestValidator.predicate(
    "the block",
    block.mark === "face" &&
      block.advance === "none" &&
      nclose(block.sample(1).grip[0], -0.18, 1e-12) &&
      nclose(block.sample(1).grip[2], 0.53, 1e-12),
  );
  TestValidator.equals(
    "one display silhouette",
    humanStagePropBeat("linked").sample(0.4),
    humanStagePropBeat("offset").sample(0.4),
  );
}
