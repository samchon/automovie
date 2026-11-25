import type { IAutoMovieMotionHumanSkill } from "@automovie/interface";
import { punchLaunch } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** A skill at one proficiency on every axis. */
const at = (x: number): IAutoMovieMotionHumanSkill => ({
  p: x,
  seed: "punch-launch",
  axes: {
    timing: x,
    path: x,
    balance: x,
    guard: x,
    power: x,
    speed: x,
    recovery: x,
    reaction: x,
    anticipation: x,
    sequencing: x,
  },
});

/**
 * A punch's trunk turn at the launch (`punchLaunch.turn`): the technique's turn
 * for the lead or rear hand, scaled by the skill's amplitude (0.6 for a novice,
 * 1 for an expert), signed toward the lead side.
 *
 * Scenario: an expert's rear straight leading left turns 60 degrees; a novice's
 * lead hook leading right turns -1 · -40 · 0.6 = 24.
 */
export function test_motions_striking_punch_launch(): void {
  TestValidator.predicate(
    "the turn",
    nclose(punchLaunch.turn("left", "straight", "rear", at(1)), 60, 1e-12) &&
      nclose(punchLaunch.turn("right", "hook", "lead", at(0)), 24, 1e-12),
  );
}
