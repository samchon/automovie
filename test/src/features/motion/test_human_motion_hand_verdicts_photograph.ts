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
 * The lexicon's `photograph` row, both hands bringing an implied camera to
 * the eye, holds every physical bound of human motion when simply
 * performed: stood for 0.3 s, then the row.
 *
 * `HumanVerdicts` reads the bounds that hold whatever a motion means: no part
 * of the body more than 10 mm inside another, every joint centre on a
 * continuous path, no bone spinning more than 5 turns a second, every joint
 * within its range. The row stands alone because one report costs minutes.
 * With both palms turned to the face at one point the hands lay 24.7 mm
 * inside each other; they now stand at the camera's two sides.
 *
 * Scenarios:
 * 1. A clean report at 12 samples a second on the average man.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers the lexicon, performs the row through the public chain and reads the shipped verdict report on the displayed film; hands inside each other, a joint that steps or a bone that spins fails with the finding's place.
 * @evidence contracts/development/testing.md#independent-expectations The bounds are the verdict report's own, which hold for any human motion; none is read from the row.
 * @evidence contracts/development/testing.md#distinguishing-cases One row on one body; the rows of the other causes are `test_human_motion_hand_verdicts`'s and its siblings'.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and audits one short film; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the bounds, why the row stands alone, what it was and the scenario.
 */
export function test_human_motion_hand_verdicts_photograph(): void {
  const laws: IHumanActionLaw<never>[] = Object.values(HUMAN_LEXICON).flat();
  const report: HumanVerdicts.IReport = HumanVerdicts.of(
    new HumanPerformance({
      seed: "verdict",
      laws,
      performers: [
        {
          subject: "a",
          body: motionHumanBody("m-average"),
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a")
        .stand({ seconds: 0.3 })
        .registered("photograph", {}).node,
    }),
    12,
  );
  TestValidator.equals(
    "a photograph holds the physical bounds",
    HumanVerdicts.describe(report),
    "clean",
  );
}
