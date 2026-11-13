import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanHabit,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The lexicon's `photograph` row, both hands bringing an implied camera to
 * the eye, keeps the two hands apart and moves its arms without a break.
 *
 * With both palms turned to the face at one point the hands lay 24.7 mm
 * inside each other; they now stand at the camera's two sides. The whole
 * verdict report took a quarter of an hour on this row, so the test reads
 * the two bounds the row has broken, on one body (the claim is the row's
 * hand attitude, not a stature) and a short hold of 0.3 s.
 *
 * Scenarios, on the average man:
 * 1. At the middle of the hold the two wrists are at least half a hand's
 *    length apart (provisional: a compact camera is wider than that, so
 *    hands nearer than this are in each other or in the camera).
 * 2. Read at 24 frames a second while the hands come to the eye and while
 *    they leave it (from the row's start to 0.1 s past `ready`, and from
 *    0.1 s before `relax` to its end), neither elbow nor wrist leaves the straight line between its neighbouring frames by more
 *    than 50 mm (provisional: a hand that covers 0.6 m in half a second by
 *    the minimum-jerk profile bends its path by 24 mm a frame at most; the
 *    arm that changed its solution between two frames broke it by 243 mm).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers the row, performs it through the public chain and reads displayed joint centres; hands on one spot or an arm that changes its solution between two frames fails.
 * @evidence contracts/development/testing.md#independent-expectations The 50 mm is twice what the smooth reach bends its path by in a frame, and the half hand a compact camera's width; both are provisional and stated as such.
 * @evidence contracts/development/testing.md#distinguishing-cases The two bounds this row broke; the other rows' full reports are its siblings'.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and reads one short film; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what the row was, why the reading is cut to two bounds, one body and a short hold, and the 2 scenarios.
 */
export function test_human_motion_hand_verdicts_photograph(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const performance: HumanPerformance = new HumanPerformance({
    seed: "verdict",
    laws: [HumanHabit.photograph],
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
      .stand({ seconds: 0.3 })
      .registered("photograph", { seconds: 0.3 }).node,
  });
  const complaints: string[] = [];

  // 1. The hands at the camera's two sides.
  const placed: HumanSegment.ISegment = performance.segments("a")[1]!;
  const instant = (event: string): number =>
    placed.start +
    (placed.plan.events.find((e): boolean => e.name === event)?.share ?? NaN) *
      placed.plan.duration;
  const held: number = (instant("strokeEnd") + instant("relax")) / 2;
  const reader: HumanSignature.IReader = HumanSignature.of(
    performance,
    "a",
    body,
    0,
  );
  const left: IAutoMovieVector3 = HumanSignature.joint(reader, held, "leftHand");
  const right: IAutoMovieVector3 = HumanSignature.joint(
    reader,
    held,
    "rightHand",
  );
  const apart: number =
    Math.hypot(left.x - right.x, left.y - right.y, left.z - right.z) /
    body.measure.hand;
  if (!(apart >= 0.5))
    complaints.push(
      `the wrists are ${apart.toFixed(2)} of a hand's length apart at the hold, at least 0.5 expected`,
    );

  // 2. No break in an arm's path, coming and going.
  const RATE: number = 24;
  const BONES = [
    "leftLowerArm",
    "rightLowerArm",
    "leftHand",
    "rightHand",
  ] as const;
  let worst: { value: number; seconds: number; bone: string } = {
    value: 0,
    seconds: 0,
    bone: "none",
  };
  for (const [from, to] of [
    [placed.start, instant("ready") + 0.1],
    [instant("relax") - 0.1, placed.end],
  ] as const) {
    const first: number = Math.floor(from * RATE);
    const last: number = Math.min(
      Math.ceil(to * RATE),
      Math.floor(performance.duration * RATE),
    );
    const paths: IAutoMovieVector3[][] = [];
    for (let i: number = first; i <= last; i++) {
      const shown: ReturnType<HumanPerformance["bones"]> = performance.bones(
        "a",
        i / RATE,
      );
      paths.push(
        BONES.map(
          (bone: (typeof BONES)[number]): IAutoMovieVector3 =>
            shown.get(bone)!.worldPosition,
        ),
      );
    }
    for (let i: number = 1; i + 1 < paths.length; i++)
      BONES.forEach((bone: (typeof BONES)[number], k: number): void => {
        const before: IAutoMovieVector3 = paths[i - 1]![k]!;
        const here: IAutoMovieVector3 = paths[i]![k]!;
        const after: IAutoMovieVector3 = paths[i + 1]![k]!;
        const value: number = Math.hypot(
          after.x - 2 * here.x + before.x,
          after.y - 2 * here.y + before.y,
          after.z - 2 * here.z + before.z,
        );
        if (!(value <= worst.value))
          worst = { value, seconds: (first + i) / RATE, bone };
      });
  }
  if (!(worst.value <= 0.05))
    complaints.push(
      `the ${worst.bone} joint's path breaks by ${(worst.value * 1000).toFixed(1)} mm at ${worst.seconds.toFixed(2)} s, within 50 mm expected`,
    );  TestValidator.equals("a photograph's two hands", complaints, []);
}
