import {
  HumanChain,
  HumanPerformance,
  HumanVerdicts,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The verdict report is clean on a sound scene and places a physical fault
 * on the performers and the action it happens in.
 *
 * A production accepts a scene only on a clean report, so the report must
 * not cry wolf on plain standing and walking, and must name where a fault
 * lies when a scene has one. The fault here is one an author can make: two
 * people staged on the same floor point, whose bodies then occupy the same
 * space for the whole film.
 *
 * Pending: on the average man the stand-then-walk scene reads a tangle of
 * 15.8 mm (spine in leftUpperArm at 2.54 s), a jump of 9.6 mm at the cut from
 * stand to walk (rightLowerLeg at 1.00 s) and a balance excursion of 43.5 mm
 * (2.21 s). The rows are on the travel family's issue; the test moves back to
 * the features with their fix.
 *
 * Scenarios, the average man as `a` and the small woman as `b`:
 * 1. `a` stands 1 s and walks 2 m while `b` stands 3 m away: the report is
 *    clean, has no finding, and describes itself as `clean`.
 * 2. Both stand on the origin: the report is not clean and holds a `partner`
 *    finding on `a+b`, deeper than the 10 mm skin limit, placed in `a`'s
 *    `stand`, occurrence 1, and its description names that place and bound.
 * 3. The performance exposes its performers in the order given.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds real performances on real bodies and reads the public report; a report that finds a fault in plain standing, misses two bodies in one place or misplaces the finding fails.
 * @evidence contracts/development/testing.md#independent-expectations The clean scene is clean because standing and walking apart break no physical bound; the faulty scene's finding follows from two solid bodies on one point, deeper than any skin allowance.
 * @evidence contracts/development/testing.md#distinguishing-cases A sound scene and a scene with one staged fault of a known class and place.
 * @evidence contracts/development/testing.md#execution-ownership Prepares polygon men, so it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the 3 scenarios and why both directions matter.
 */
export function test_human_motion_verdicts_stand_walk(): void {
  const a: IHumanBody = motionHumanBody("m-average");
  const b: IHumanBody = motionHumanBody("f-small");
  const perform = (gap: number, chain: HumanChain): HumanPerformance =>
    new HumanPerformance({
      seed: "verdicts",
      performers: [
        {
          subject: "a",
          body: a,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
        {
          subject: "b",
          body: b,
          at: { x: gap, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: chain.with(HumanChain.subject("b").stand({ seconds: 1 }))
        .node,
    });

  // 1. A sound scene.
  const sound: HumanPerformance = perform(
    3,
    HumanChain.subject("a")
      .stand({ seconds: 1 })
      .walk({ to: { x: 0, y: 0, z: 2 } }),
  );
  const clean: HumanVerdicts.IReport = HumanVerdicts.of(sound);
  TestValidator.predicate(
    `standing and walking apart is clean, got ${HumanVerdicts.describe(clean)}`,
    clean.clean && clean.findings.length === 0,
  );
  TestValidator.equals(
    "a clean report describes itself",
    HumanVerdicts.describe(clean),
    "clean",
  );

  // 2. Two bodies on one floor point.
  const merged: HumanVerdicts.IReport = HumanVerdicts.of(
    perform(0, HumanChain.subject("a").stand({ seconds: 1 })),
  );
  const partner: HumanVerdicts.IFinding | undefined = merged.findings.find(
    (f: HumanVerdicts.IFinding): boolean => f.check === "partner",
  );
  TestValidator.predicate(
    `two bodies on one point are found, got ${HumanVerdicts.describe(merged)}`,
    !merged.clean && partner !== undefined,
  );
  if (partner !== undefined) {
    TestValidator.equals(
      "the finding names both people",
      partner.subject,
      "a+b",
    );
    TestValidator.predicate(
      `the bodies are deeper in each other than the skin gives, got ${partner.value}`,
      partner.value > HumanVerdicts.SKIN &&
        partner.limit === HumanVerdicts.SKIN,
    );
    TestValidator.equals("it is placed in a's stand", partner.act, "stand");
    TestValidator.equals("at its first occurrence", partner.instance, 1);
    TestValidator.predicate(
      `the description names the place and the bound, got ${HumanVerdicts.describe(merged)}`,
      HumanVerdicts.describe(merged).includes("a+b.stand#1 partner "),
    );
  }

  // 3. The performers, in order.
  TestValidator.equals(
    "the performance exposes its performers",
    sound.performers.map((p): string => p.subject),
    ["a", "b"],
  );
}
