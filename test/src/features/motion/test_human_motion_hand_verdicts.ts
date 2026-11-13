import {
  HUMAN_LEXICON,
  HumanChain,
  HumanPerformance,
  HumanVerdicts,
  type IHumanActionLaw,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The lexicon's hand rows hold every physical bound of human motion when
 * they are simply performed: stood for 0.3 s, then the row.
 *
 * `HumanVerdicts` reads the bounds that hold whatever a motion means: no
 * part of the body more than 10 mm inside another, every joint centre on a
 * continuous path (no step over 5 mm), no bone spinning more than 5 turns a
 * second, every joint within its range. A report costs up to minutes, so
 * one row stands for each way a hand row has broken them:
 *
 * - `handsOnHips` (a rest place): the arm's transport from the hanging arm
 *   to its place, where a fit asked for a hand part way along a nearly
 *   straight arm let the elbow change sides for an instant, and the fingers
 *   took their shape in one step.
 * - `hush` (the forefinger across the lips): a hand attitude that pinned
 *   the wrist at the end of its range, where the arm's fit changes its
 *   solution from one instant to the next and the curled fingers stood in
 *   the neck.
 * - `blownKiss` and `smoke` (fingertips, and a held end, at the lips): the
 *   same, with the forearm's turn at the end of its range.
 *
 * Scenarios, each a clean report at 12 samples a second:
 * 1. `handsOnHips` on the small woman.
 * 2. `hush` on the average man.
 * 3. `blownKiss` on the small woman.
 * 4. `smoke` on the average man.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers the lexicon, performs each row through the public chain and reads the shipped verdict report on the displayed film; a hand through the neck, a joint that steps or a bone that spins fails with the finding's place.
 * @evidence contracts/development/testing.md#independent-expectations The bounds are the verdict report's own, which hold for any human motion and are stated in its documentation; none is read from the rows.
 * @evidence contracts/development/testing.md#distinguishing-cases One row per cause over two laws and two bodies of opposite build; the other rows of each cause are left to the lexicon's own tests, since a report is costly.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and audits four short films; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the bounds, why each row was chosen and the 4 scenarios.
 */
export function test_human_motion_hand_verdicts(): void {
  const laws: IHumanActionLaw<never>[] = Object.values(HUMAN_LEXICON).flat();
  const complaints: string[] = [];
  for (const [name, row] of [
    ["f-small", "handsOnHips"],
    ["m-average", "hush"],
    ["f-small", "blownKiss"],
    ["m-average", "smoke"],
  ] as const)
    try {
      const report: HumanVerdicts.IReport = HumanVerdicts.of(
        new HumanPerformance({
          seed: "verdict",
          laws,
          performers: [
            {
              subject: "a",
              body: motionHumanBody(name),
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
          ],
          composition: HumanChain.subject("a")
            .stand({ seconds: 0.3 })
            .registered(row, {}).node,
        }),
        12,
      );
      if (!report.clean)
        complaints.push(`${name} ${row}: ${HumanVerdicts.describe(report)}`);
    } catch (error) {
      complaints.push(
        `${name} ${row}: expected to plan, got ${(error as Error).message}`,
      );
    }
  TestValidator.equals("hand rows hold the physical bounds", complaints, []);
}
