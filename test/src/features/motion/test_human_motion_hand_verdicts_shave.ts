import { createCareItem } from "@automovie/archetypes";
import {
  HUMAN_LEXICON,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanVerdicts,
  type IHumanActionLaw,
  type IHumanPosture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The lexicon's `shave` row, the head of a held razor rubbed up the jaw,
 * holds every physical bound of human motion when simply performed: the
 * razor (a toothbrush stands in, a handle with a working head at its far
 * end, as no razor archetype exists yet) picked up for its use on the right
 * jaw, then the row with that grasp kept, so the stroke holds the razor as
 * the grasp presents it there and moves only its head.
 *
 * `HumanVerdicts` reads the bounds that hold whatever a motion means: no part
 * of the body more than 10 mm inside another, every joint centre on a
 * continuous path, no bone spinning more than 5 turns a second, every joint
 * within its range. The row stands alone because one report costs minutes.
 * Performed with an implied tool on a fist, the hand stood at three range
 * ends through the stroke whatever its turn about the razor's line, so the
 * row takes the razor as a held tool, as the drink and the cigarette do;
 * laid by its head's facing alone, the held razor asked a turn beyond the
 * wrist, so its angle is the grasp's, chosen for the jaw. Its line laid
 * oblique into the face put the fingers round the handle 13 mm inside the
 * head through the whole stroke, so the razor lies along the jaw with its
 * head's face on it (`along`), the hand away from the skin.
 * Each finding carries the posture at its instant, so the fit it came from
 * can be read off the complaint.
 *
 * Scenarios:
 * 1. A clean report on the average man at 6 samples a second: the report quarters every interval a joint departs in, so a step is found on a coarse grid too, and the finer grid only costs time.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers the lexicon, performs the row through the public chain and reads the shipped verdict report on the displayed film; a hand in the head, a joint that steps or a bone that spins fails with the finding's place and the posture there.
 * @evidence contracts/development/testing.md#independent-expectations The bounds are the verdict report's own, which hold for any human motion; none is read from the row.
 * @evidence contracts/development/testing.md#distinguishing-cases One row on one body; the rows of the other causes are `test_human_motion_hand_verdicts`'s and its siblings'.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and one archetype and audits one short film; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the bounds, why the row stands alone, what it was, what a complaint carries and the scenario.
 */
export function test_human_motion_hand_verdicts_shave(): void {
  const laws: IHumanActionLaw<never>[] = Object.values(HUMAN_LEXICON).flat();
  const body = motionHumanBody("m-average");
  // A toothbrush stands in for the razor: a handle and a working head at
  // its far end, the razor's own shape (no razor archetype exists yet).
  const razor = createCareItem({ kind: "toothbrush" });
  const performance: HumanPerformance = new HumanPerformance({
    seed: "verdict",
    laws,
    props: [
      HumanObject.prop("razor", razor, {
        at: {
          x: -body.measure.shoulderHalfWidth,
          y: body.measure.waistHeight,
          z: 0.6 * (body.measure.upperArm + body.measure.forearm),
        },
        yaw: 0,
      }),
    ],
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a")
      .pickUp({
        prop: "razor",
        handle: "grip",
        use: { tip: "face", line: "along", at: { region: "jawRight" } },
      })
      .registered("shave", {
        prop: "razor",
        point: "face",
        grasp: { handle: "grip", line: "along" },
      }).node,
  });
  const report: HumanVerdicts.IReport = HumanVerdicts.of(performance, 6);

  TestValidator.equals(
    "a shave holds the physical bounds",
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
          `shave instants: ${performance
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
