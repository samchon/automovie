import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  HumanSignature,
  StrikingGuardYield,
  StrikingTarget,
  resolveHumanPosture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Two fighters who take their guards facing each other, closer than their
 * guards held where they stand would allow, step apart until neither body
 * is inside the other: every pair of builds, each guard taking its half of
 * the step (`StrikingGuardYield`).
 *
 * Scenarios, the pairs (small woman, average man), (large man, average man),
 * (average man, small woman) and (tall woman, large man), standing 0.9 of
 * the shorter hip height apart, the kicking range of the striking captures,
 * each taking a guard facing the other's face:
 * 1. At the guards' `set` (0.6 s), no joint of either body lies inside the
 *    other's colliders (the partner verdict's reading, `HumanSignature.apart`).
 * 2. Neither fighter steps back farther than the other by more than a
 *    centimetre, the reciprocal share.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs two real guards through the public chain and reads both displayed bodies at `set`; a guard that holds its fists inside the other's arms, or a fighter that takes the whole step, fails with the pair and the numbers.
 * @evidence contracts/development/testing.md#independent-expectations The distance is the striking captures' kicking range; the clearance is the partner verdict's reading of two bodies; the share is the reciprocal rule's.
 * @evidence contracts/development/testing.md#distinguishing-cases Four pairs of builds, the smaller and the larger fighter on either side.
 * @evidence contracts/development/testing.md#execution-ownership Prepares polygon men and builds four short performances in memory; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the act, the staging, the bounds and the 2 scenarios.
 */
export function test_motion_striking_guard_yield(): void {
  const complaints: string[] = [];
  const mm: (metres: number) => string = (metres: number): string =>
    (metres * 1000).toFixed(1);
  for (const [first, second] of [
    ["f-small", "m-average"],
    ["m-large", "m-average"],
    ["m-average", "f-small"],
    ["f-tall", "m-large"],
  ] as const) {
    const a: IAutoMovieMotionHumanBody = motionHumanBody(first);
    const b: IAutoMovieMotionHumanBody = motionHumanBody(second);
    const gap: number =
      0.9 * Math.min(a.measure.hipHeight, b.measure.hipHeight);
    const film: IAutoMovieMotionHumanPerformance = new HumanPerformance({
      seed: "guard-yield",
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
          at: { x: 0, y: 0, z: gap },
          yaw: 180,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a")
        .guard({
          seconds: 1,
          facing: { kind: "person", subject: "b", region: "face" },
        })
        .with(
          HumanChain.subject("b").guard({
            seconds: 1,
            facing: { kind: "person", subject: "a", region: "face" },
          }),
        ).node,
    });
    const set: number = 0.6;
    const clear: number = HumanSignature.apart(
      HumanSignature.of(film, "a", a, 0),
      HumanSignature.of(film, "b", b, 0),
      set,
    );
    const back: (subject: "a" | "b", sign: number) => number = (
      subject: "a" | "b",
      sign: number,
    ): number =>
      sign *
      (film.bones(subject, set).get("hips")!.worldPosition.z -
        film.bones(subject, 0).get("hips")!.worldPosition.z);
    const backA: number = back("a", -1);
    const backB: number = back("b", 1);
    if (clear < 0) {
      // How far the guard each fighter anticipates of the other
      // (`StrikingGuardYield.held`, from where the other stood) lies from
      // the guard shown, joint by joint, so a failing row says whether the
      // anticipation or the step is wrong.
      const anticipated: (
        subject: "a" | "b",
        body: IAutoMovieMotionHumanBody,
        toward: IAutoMovieVector3,
      ) => string = (
        subject: "a" | "b",
        body: IAutoMovieMotionHumanBody,
        toward: IAutoMovieVector3,
      ): string => {
        const shown: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          film.bones(subject, set);
        const stood: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          film.bones(subject, 0);
        const left: IAutoMovieVector3 = stood.get("leftFoot")!.worldPosition;
        const right: IAutoMovieVector3 = stood.get("rightFoot")!.worldPosition;
        const centre: IAutoMovieVector3 = {
          x: (left.x + right.x) / 2,
          y: 0,
          z: (left.z + right.z) / 2,
        };
        const held: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          body.poseResolution.resolveMap(
            resolveHumanPosture(
              body,
              StrikingGuardYield.held(
                body,
                {
                  lead: "left",
                  line: StrikingTarget.heading(
                    StrikingTarget.line(centre, toward, 0),
                  ),
                },
                centre,
                film.posture(subject, 0).joints,
              ),
            ),
          );
        let worst: { bone: string; off: number } = { bone: "none", off: 0 };
        for (const [bone, frame] of shown) {
          const other: IAutoMovieResolvedBone | undefined = held.get(bone);
          if (other === undefined) continue;
          const off: number = Vector3.length(
            Vector3.subtract(frame.worldPosition, other.worldPosition),
          );
          if (off > worst.off) worst = { bone, off };
        }
        const at: (bone: AutoMovieHumanoidBone) => string = (
          bone: AutoMovieHumanoidBone,
        ): string =>
          `${bone} ${mm(
            Vector3.length(
              Vector3.subtract(
                shown.get(bone)!.worldPosition,
                held.get(bone)!.worldPosition,
              ),
            ),
          )}`;
        return `${subject}'s anticipated guard is up to ${mm(worst.off)} mm off the shown one (${worst.bone}; ${(["hips", "chest", "head", "leftHand", "rightHand"] as const).map(at).join(", ")})`;
      };
      complaints.push(
        `${first} facing ${second} ${mm(gap)} mm apart: at set the bodies are ${mm(-clear)} mm inside each other, apart expected; the fighters stepped back ${mm(backA)} and ${mm(backB)} mm; ${anticipated("a", a, { x: 0, y: 0, z: gap })}; ${anticipated("b", b, { x: 0, y: 0, z: 0 })}`,
      );
    }
    if (Math.abs(backA - backB) > 0.01)
      complaints.push(
        `${first} facing ${second}: the fighters stepped back ${mm(backA)} and ${mm(backB)} mm, within 10 mm of each other expected`,
      );
  }
  TestValidator.equals(
    "two guards facing each other stand clear of each other",
    complaints,
    [],
  );
}
