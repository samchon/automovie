import type {
  IAutoMovieMotionHumanSkill,
  IAutoMovieMotionHumanStrikingSkill,
  IAutoMovieRandom,
} from "@automovie/interface";
import { StrikingSkill } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

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
  seed: "unit",
});

/** A random stream reading its floats from a table, by index. */
const table = (floats: readonly number[]): IAutoMovieRandom => ({
  seed: "table",
  block: (): [number, number, number, number] => [0, 0, 0, 0],
  uint32: (): number => 0,
  float: (index: number): number => floats[index]!,
  stream: (): IAutoMovieRandom => table(floats),
});

/**
 * `StrikingSkill` reads each striking quantity from a skill as its novice and
 * elite values joined by the smoothstep of the axis's proficiency
 * (`HumanSkill.quantity`, `x² (3 − 2x)`).
 *
 * Scenarios:
 *
 * 1. A novice (every axis 0) takes the novice values: a punch peaking at 0.45 ·
 *    7.16 m/s, strikes slowed by 1.06, a same-hand interval of 1.35 / 3 · 1.06
 *    s, recovery 1.4, amplitude 0.6, lag 0.03 s, defence 0.3, anticipation 0 to
 *    0.03 s, and a reaction law of 0.335, 0.06 and 0.04 s banded at `mu ∓ 2.326
 *    sigma` with `tau ln 100` above.
 * 2. An elite takes the elite values, and an axis at a half the middle.
 * 3. A lone strike delivers its path's share of the cross's delivery, and the
 *    whole of it with no cross.
 * 4. A reaction drawn far past the band is held at its top.
 * 5. A novice drops the guard on a draw under 0.6, the depth and the seconds read
 *    from the next two draws; an elite, on a draw at 0.5, does not.
 */
export function test_unit_motions_striking_skill(): void {
  const novice: IAutoMovieMotionHumanSkill = at(0);
  const elite: IAutoMovieMotionHumanSkill = at(1);
  TestValidator.predicate(
    "the novice values",
    nclose(StrikingSkill.punchPeak(novice), 0.45 * 7.16, 1e-12) &&
      StrikingSkill.strike(novice) === 1.06 &&
      nclose(StrikingSkill.interval(novice, true), (1.35 / 3) * 1.06, 1e-12) &&
      nclose(StrikingSkill.interval(novice, false), (1.05 / 3) * 1.06, 1e-12) &&
      StrikingSkill.recovery(novice) === 1.4 &&
      StrikingSkill.amplitude(novice) === 0.6 &&
      StrikingSkill.lag(novice) === 0.03 &&
      StrikingSkill.defence(novice) === 0.3,
  );
  TestValidator.equals(
    "the novice's anticipation",
    StrikingSkill.anticipation(novice),
    [0, 0.03],
  );
  TestValidator.equals(
    "the novice's reaction law",
    StrikingSkill.reactionLaw(novice),
    {
      mu: 0.335,
      sigma: 0.06,
      tau: 0.04,
    },
  );
  const [low, high]: readonly [number, number] =
    StrikingSkill.reactionBand(novice);
  TestValidator.predicate(
    "the novice's reaction band",
    nclose(low, 0.335 - 2.326 * 0.06, 1e-12) &&
      nclose(high, 0.335 + 2.326 * 0.06 + 0.04 * Math.log(100), 1e-12),
  );

  TestValidator.predicate(
    "the elite and the middle",
    StrikingSkill.punchPeak(elite) === 7.16 &&
      StrikingSkill.strike(elite) === 1 &&
      StrikingSkill.lag(elite) === 0.12 &&
      nclose(StrikingSkill.strike(at(0.5)), 1.03, 1e-12) &&
      nclose(StrikingSkill.punchPeak(at(0.5)), (0.45 * 7.16 + 7.16) / 2, 1e-12),
  );

  TestValidator.predicate(
    "a lone strike's delivery",
    nclose(StrikingSkill.lone(0.2, 0.4, novice), 0.31 * 0.5 * 1.06, 1e-12) &&
      nclose(StrikingSkill.lone(0.2, 0, novice), 0.31 * 1.06, 1e-12),
  );

  TestValidator.predicate(
    "a reaction past the band is held at its top",
    nclose(
      StrikingSkill.reaction(novice, table([0.5, 0.5, 1 - 1e-12]), 0),
      high,
      1e-12,
    ),
  );

  const drop: IAutoMovieMotionHumanStrikingSkill.IGuardDrop =
    StrikingSkill.guardDrop(novice, table([0.5, 0.25, 0.75]), 0);
  TestValidator.predicate(
    "a novice drops the guard",
    nclose(drop.depth, 0.08 + 0.07 * 0.25, 1e-12) &&
      nclose(drop.seconds, 0.3 + 0.3 * 0.75, 1e-12),
  );
  TestValidator.equals(
    "an elite keeps it",
    StrikingSkill.guardDrop(elite, table([0.5, 0.25, 0.75]), 0),
    { depth: 0, seconds: 0 },
  );
}
