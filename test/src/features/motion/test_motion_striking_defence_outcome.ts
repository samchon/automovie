import { createAutoMovieRandom, deriveAutoMovieSeed } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanDefenceOutcome,
  IAutoMovieMotionHumanSkill,
} from "@automovie/interface";
import {
  DefenceOutcome,
  HumanRefusal,
  HumanSkill,
  StrikingSkill,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/throwsError";

/**
 * The defence outcome law classifies by margin, realises forced outcomes
 * with plausible timing, stretches the attack before it refuses, and makes a
 * purely reactive defence unable to beat a fast kick (experiment E4).
 *
 * Scenarios:
 * 1. The margin classes: 0 and above in time, between minus half the
 *    defence time and 0 late, at or below it a fail.
 * 2. A block forced in time, late and fail against a fast kick (contact 0.33
 *    s after launch) and a slow one (0.6 s), elite with half telegraph and an
 *    attack stretch band of 0.5 to 1.5, over 40 seeds each: every decision
 *    lands in its band (the slow kick's fail needs the
 *    attack shortened), its reaction and lead lie in their bands, and the
 *    start and margin satisfy `start = launch + RT - lead x telegraph`,
 *    `m = hit - start - T_def` on the stretched contact.
 * 3. A novice forced in time against the fast kick with no telegraph is
 *    impossible at plausible timing: without a stretch it is refused on
 *    `outcome`, naming fail among the reachable outcomes and not in time
 *    (the outcome is the author's input, so it is never realised in another
 *    band); with a stretch band up to 1.6 the attack is slowed to the
 *    closed-form factor (reaching 2 % of the defence time inside the band)
 *    and the defence is in time.
 * 4. Unforced over 400 seeds: with no telegraph neither a novice nor an elite
 *    is ever in time against the fast kick (the kick lands in about one
 *    reaction time); with full telegraph an elite sometimes is; the elite
 *    reaction mean lies within 20 % of the ex-Gaussian mean `mu + tau`.
 * 5. The same seed gives the same decision; invalid timing throws.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public decision and reads its outcome, timing and refusal; a wrong band edge, a split outside the plausible bands, an impossible outcome realised instead of refused or a stretch never applied fails.
 * @evidence contracts/development/testing.md#independent-expectations Bands and identities follow from the law's definition; the impossibility follows from the band arithmetic `0.33 - (0.335 - 2.326 x 0.06) - 0.3 < 0` and the stretch from solving it for the factor; the ex-Gaussian mean is mu + tau.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers each class edge, both kick speeds, both skill ends, forced and unforced, feasible and impossible forcing, with and without a stretch.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 scenarios and what each pins.
 */
export function test_motion_striking_defence_outcome(): void {
  TestValidator.equals(
    "in time at zero",
    DefenceOutcome.classify(0, 0.2),
    "inTime",
  );
  TestValidator.equals(
    "late inside half",
    DefenceOutcome.classify(-0.05, 0.2),
    "late",
  );
  TestValidator.equals(
    "fail at half",
    DefenceOutcome.classify(-0.1, 0.2),
    "fail",
  );

  const elite: IAutoMovieMotionHumanSkill = HumanSkill.resolve(
    { level: "elite" },
    "e4",
  );
  const novice: IAutoMovieMotionHumanSkill = HumanSkill.resolve(
    { level: "novice" },
    "e4",
  );
  const random = (k: number) =>
    createAutoMovieRandom(deriveAutoMovieSeed("e4", String(k)));
  const close = (a: number, b: number): boolean => Math.abs(a - b) <= 1e-9;

  for (const hit of [0.33, 0.6])
    for (const forced of ["inTime", "late", "fail"] as const)
      for (let k: number = 0; k < 40; k++) {
        const movement: number = StrikingSkill.defence(elite);
        const d: IAutoMovieMotionHumanDefenceOutcome.IDecision =
          DefenceOutcome.decide(
            {
              launch: 1,
              hit: 1 + hit,
              telegraph: 0.5,
              movement,
              skill: elite,
              stretch: [0.5, 1.5],
            },
            random(k),
            forced,
          );
        const [r0, r1] = StrikingSkill.reactionBand(elite);
        const [a0, a1] = StrikingSkill.anticipation(elite);
        TestValidator.predicate(
          `forced ${forced} against a ${hit} s kick, seed ${k}`,
          d.outcome === forced &&
            d.reaction >= r0 - 1e-12 &&
            d.reaction <= r1 + 1e-12 &&
            d.lead >= a0 - 1e-12 &&
            d.lead <= a1 + 1e-12 &&
            close(d.start, 1 + d.reaction - 0.5 * d.lead) &&
            close(d.margin, d.hit - d.start - movement),
        );
      }

  const movement: number = StrikingSkill.defence(novice);
  const [n0] = StrikingSkill.reactionBand(novice);
  let refused: unknown;
  try {
    DefenceOutcome.decide(
      { launch: 0, hit: 0.33, telegraph: 0, movement, skill: novice },
      random(1),
      "inTime",
    );
  } catch (error: unknown) {
    refused = error;
  }
  TestValidator.predicate(
    "impossible forcing is refused on outcome with the reachable outcomes",
    refused instanceof HumanRefusal &&
      refused.axis === "outcome" &&
      refused.feasible?.kind === "alternatives" &&
      !refused.feasible.values.includes("inTime") &&
      refused.feasible.values.includes("fail"),
  );
  const stretched: IAutoMovieMotionHumanDefenceOutcome.IDecision =
    DefenceOutcome.decide(
      {
        launch: 0,
        hit: 0.33,
        telegraph: 0,
        movement,
        skill: novice,
        stretch: [1, 1.6],
      },
      random(1),
      "inTime",
    );
  const needed: number = (n0 + 1.02 * movement) / 0.33;
  TestValidator.predicate(
    "a stretch makes it possible",
    stretched.outcome === "inTime" &&
      Math.abs(stretched.stretch - needed) <= 1e-9 &&
      needed <= 1.6,
  );

  let reactive: number = 0;
  let anticipated: number = 0;
  let sum: number = 0;
  for (let k: number = 0; k < 400; k++) {
    for (const skill of [novice, elite]) {
      const d = DefenceOutcome.decide(
        {
          launch: 0,
          hit: 0.33,
          telegraph: 0,
          movement: StrikingSkill.defence(skill),
          skill,
        },
        random(1000 + k),
      );
      if (d.outcome === "inTime") reactive++;
    }
    const e = DefenceOutcome.decide(
      {
        launch: 0,
        hit: 0.33,
        telegraph: 1,
        movement: StrikingSkill.defence(elite),
        skill: elite,
      },
      random(2000 + k),
    );
    if (e.outcome === "inTime") anticipated++;
    sum += e.reaction;
  }
  const law = StrikingSkill.reactionLaw(elite);
  TestValidator.predicate(
    "a reactive defence never beats a fast kick",
    reactive === 0,
  );
  TestValidator.predicate("anticipation sometimes does", anticipated > 0);
  TestValidator.predicate(
    "elite reaction mean",
    Math.abs(sum / 400 - (law.mu + law.tau)) <= 0.2 * (law.mu + law.tau),
  );

  const a = DefenceOutcome.decide(
    { launch: 0, hit: 0.5, telegraph: 0.5, movement: 0.2, skill: elite },
    random(7),
    "late",
  );
  const b = DefenceOutcome.decide(
    { launch: 0, hit: 0.5, telegraph: 0.5, movement: 0.2, skill: elite },
    random(7),
    "late",
  );
  TestValidator.predicate(
    "deterministic",
    a.start === b.start && a.reaction === b.reaction && a.lead === b.lead,
  );
  TestValidator.predicate(
    "contact before launch",
    throwsError((): unknown =>
      DefenceOutcome.decide(
        { launch: 1, hit: 0.5, telegraph: 0, movement: 0.2, skill: elite },
        random(0),
      ),
    ),
  );
  TestValidator.predicate(
    "telegraph out of range",
    throwsError((): unknown =>
      DefenceOutcome.decide(
        { launch: 0, hit: 0.5, telegraph: 2, movement: 0.2, skill: elite },
        random(0),
      ),
    ),
  );
}
