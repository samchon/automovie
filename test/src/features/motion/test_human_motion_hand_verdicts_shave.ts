import {
  HUMAN_LEXICON,
  HumanChain,
  HumanPerformance,
  HumanVerdicts,
  type IHumanActionLaw,
  type IHumanPosture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The lexicon's `shave` row, a razor's head rubbed up the jaw, holds every
 * physical bound of human motion when simply performed: stood for 0.3 s,
 * then the row.
 *
 * `HumanVerdicts` reads the bounds that hold whatever a motion means: no part
 * of the body more than 10 mm inside another, every joint centre on a
 * continuous path, no bone spinning more than 5 turns a second, every joint
 * within its range. The row stands alone because one report costs minutes.
 * With the thumb's axis turned into the jaw the wrist and the forearm stood
 * at the ends of their ranges and a joint stepped 7.1 mm on the way back.
 * Each finding carries the posture at its instant, so the fit it came from
 * can be read off the complaint.
 *
 * Scenarios:
 * 1. A clean report on the average man at 6 samples a second: the report quarters every interval a joint departs in, so a step is found on a coarse grid too, and the finer grid only costs time.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers the lexicon, performs the row through the public chain and reads the shipped verdict report on the displayed film; a hand in the head, a joint that steps or a bone that spins fails with the finding's place and the posture there.
 * @evidence contracts/development/testing.md#independent-expectations The bounds are the verdict report's own, which hold for any human motion; none is read from the row.
 * @evidence contracts/development/testing.md#distinguishing-cases One row on one body; the rows of the other causes are `test_human_motion_hand_verdicts`'s and its siblings'.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and audits one short film; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the bounds, why the row stands alone, what it was, what a complaint carries and the scenario.
 */
export function test_human_motion_hand_verdicts_shave(): void {
  const laws: IHumanActionLaw<never>[] = Object.values(HUMAN_LEXICON).flat();
  const performance: HumanPerformance = new HumanPerformance({
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
      .registered("shave", {}).node,
  });
  const report: HumanVerdicts.IReport = HumanVerdicts.of(performance, 6);
  TestValidator.equals(
    "a shave holds the physical bounds",
    report.clean
      ? "clean"
      : [
          HumanVerdicts.describe(report),
          ...report.findings.map(
            (f: HumanVerdicts.IFinding): string =>
              `posture at ${f.seconds.toFixed(2)} s: ${dump(performance.posture("a", f.seconds))}`,
          ),
        ].join("\n"),
    "clean",
  );
}

/** A posture as text for a complaint: root, yaw, pitch, roll, every set joint and every limb goal, numbers to four places, a goal's colliders left out. */
function dump(posture: IHumanPosture): string {
  return JSON.stringify(
    {
      root: posture.root,
      yaw: posture.yaw,
      pitch: posture.pitch,
      roll: posture.roll,
      joints: posture.joints,
      limbs: Object.fromEntries(
        Object.entries(posture.limbs).map(
          ([limb, goal]: [string, IHumanPosture.IGoal | undefined]): [
            string,
            object | undefined,
          ] => [limb, goal === undefined ? goal : { ...goal, clear: undefined }],
        ),
      ),
    },
    (_: string, value: unknown): unknown =>
      typeof value === "number" ? Math.round(value * 1e4) / 1e4 : value,
  );
}
