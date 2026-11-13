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
 * The lexicon's `smoke` row, a cigarette's end held at the lips, holds every physical bound of
 * human motion when simply performed: stood for 0.3 s, then the row.
 *
 * `HumanVerdicts` reads the bounds that hold whatever a motion means: no part
 * of the body more than 10 mm inside another, every joint centre on a
 * continuous path, no bone spinning more than 5 turns a second, every joint
 * within its range. The row stands alone because one report costs half a
 * minute and a failing row reruns by itself.
 * With the thumb's axis turned into the mouth the wrist and the forearm stood at the ends of their ranges; the fingers now point up and back at the mouth.
 *
 * Scenarios:
 * 1. A clean report on the average man at 6 samples a second: the report quarters every interval a joint departs in, so a step is found on a coarse grid too, and the finer grid only costs time.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers the lexicon, performs the row through the public chain and reads the shipped verdict report on the displayed film; a part inside another, a joint that steps or a bone that spins fails with the finding's place.
 * @evidence contracts/development/testing.md#independent-expectations The bounds are the verdict report's own, which hold for any human motion; none is read from the row.
 * @evidence contracts/development/testing.md#distinguishing-cases One row on one body; the rows of the other causes are `test_human_motion_hand_verdicts`'s and its siblings'.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and audits one short film; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the bounds, why the row stands alone, what it was and the scenario.
 */
export function test_human_motion_hand_verdicts_smoke(): void {
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
        .registered("smoke", {}).node,
  });
  const report: HumanVerdicts.IReport = HumanVerdicts.of(performance, 6);
  TestValidator.equals(
    "a draw on a cigarette holds the physical bounds",
    report.clean
      ? "clean"
      : [
          HumanVerdicts.describe(report),
          ...report.findings.flatMap((f: HumanVerdicts.IFinding): string[] =>
            [f.seconds - 1 / 48, f.seconds].map(
              (seconds: number): string =>
                `posture at ${seconds.toFixed(3)} s: ${dump(performance.posture("a", seconds))}`,
            ),
          ),
          // The row's phase instants and, around each finding, the
          // offending joint's world path and its own and its parent's angles.
          `smoke instants: ${performance
            .segments("a")[1]!
            .plan.events.map(
              (e): string =>
                `${e.name} ${(performance.segments("a")[1]!.start + e.share * performance.segments("a")[1]!.plan.duration).toFixed(3)}`,
            )
            .join(", ")}`,
          ...report.findings.flatMap((f: HumanVerdicts.IFinding): string[] =>
            Array.from({ length: 13 }, (_: unknown, i: number): string => {
              const seconds: number = f.seconds + (i - 6) / 48;
              const bones = performance.bones("a", seconds);
              const bone = bones.get(f.where as "rightLowerArm");
              const pose = performance.pose("a", seconds);
              const angles = (name: string): string =>
                JSON.stringify(
                  pose.joints.find((j): boolean => j.bone === name) ?? null,
                  (_k: string, v: unknown): unknown =>
                    typeof v === "number" ? Math.round(v * 100) / 100 : v,
                );
              return `${seconds.toFixed(3)} s ${f.where} at ${bone === undefined ? "?" : `(${bone.worldPosition.x.toFixed(4)}, ${bone.worldPosition.y.toFixed(4)}, ${bone.worldPosition.z.toFixed(4)})`} ${angles("rightUpperArm")} ${angles("rightLowerArm")} ${angles("rightHand")}`;
            }),
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

