import type {
  IAutoMovieMotionHumanDefenceOutcome,
  IAutoMovieMotionHumanSkill,
  IAutoMovieRandom,
} from "@automovie/interface";
import { DefenceOutcome, StrikingSkill } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

/** A skill at one proficiency on every axis. */
const at = (x: number): IAutoMovieMotionHumanSkill => ({
  p: x,
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

/** A draw at a fixed share. */
const draw = (share: number): IAutoMovieRandom => {
  const random: IAutoMovieRandom = {
    block: () => [0, 0, 0, 0],
    uint32: () => 0,
    float: () => share,
    stream: () => random,
  };
  return random;
};

/** A 0.4 s attack telegraphed half way, met by a 0.2 s defence. */
const INPUT: IAutoMovieMotionHumanDefenceOutcome.IInput = {
  launch: 0,
  hit: 0.4,
  telegraph: 0.5,
  movement: 0.2,
  skill: at(0.5),
  stretch: [0.5, 2],
};

/**
 * A defence's outcome (`DefenceOutcome.classify`, `band`, `decide`): in time
 * with a margin to spare, late within half the defence's movement, failed
 * beyond; unforced it is whatever the skill's draws give; forced, the start is
 * drawn strictly inside both the outcome's band and the skill's plausible band,
 * stretching the attack toward it, and an outcome no allowed stretch makes
 * plausible is refused.
 *
 * Scenarios:
 *
 * 1. Margins of 0.1, -0.05 and -0.15 s on a 0.2 s defence are in time, late and
 *    failed; the bands split at 0 and -0.1 s.
 * 2. Unforced, the decision's margin is the hit less the start and the movement,
 *    classified.
 * 3. Forced to each outcome, the decision is that outcome, its reaction and lead
 *    inside the skill's bands.
 * 4. Forced in time with an attack that may not stretch and lands at once, it is
 *    refused.
 */
export function test_unit_motions_striking_defence_outcome(): void {
  TestValidator.equals(
    "classified",
    [
      DefenceOutcome.classify(0.1, 0.2),
      DefenceOutcome.classify(-0.05, 0.2),
      DefenceOutcome.classify(-0.15, 0.2),
    ],
    ["inTime", "late", "fail"],
  );
  TestValidator.equals(
    "the bands",
    [
      DefenceOutcome.band("inTime", 0.2),
      DefenceOutcome.band("late", 0.2),
      DefenceOutcome.band("fail", 0.2),
    ],
    [
      [0, Infinity],
      [-0.1, 0],
      [-Infinity, -0.1],
    ],
  );
  const free = DefenceOutcome.decide(INPUT, draw(0.5));
  TestValidator.predicate(
    "unforced",
    Math.abs(free.margin - (INPUT.hit - (free.start + INPUT.movement))) <
      1e-12 &&
      free.outcome === DefenceOutcome.classify(free.margin, INPUT.movement) &&
      free.stretch === 1,
  );
  const [rLow, rHigh] = StrikingSkill.reactionBand(INPUT.skill);
  const [aLow, aHigh] = StrikingSkill.anticipation(INPUT.skill);
  for (const outcome of ["inTime", "late", "fail"] as const) {
    const forced = DefenceOutcome.decide(INPUT, draw(0.5), outcome);
    TestValidator.predicate(
      `forced ${outcome}`,
      forced.outcome === outcome &&
        forced.reaction >= rLow - 1e-12 &&
        forced.reaction <= rHigh + 1e-12 &&
        forced.lead >= aLow - 1e-12 &&
        forced.lead <= aHigh + 1e-12,
    );
  }
  TestValidator.predicate(
    "implausible",
    throwsError(() =>
      DefenceOutcome.decide(
        { ...INPUT, hit: 0.01, stretch: [1, 1] },
        draw(0.5),
        "inTime",
      ),
    ),
  );
}
