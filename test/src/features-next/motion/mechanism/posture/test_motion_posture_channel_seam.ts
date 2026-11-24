import type {
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformance,
} from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";

/**
 * Cutting a stance transfers its pose continuously. A moving stroke owns its
 * channels until an allowed interruption or the end of the stroke.
 *
 * Scenarios:
 * 1. A walk cut from standing starts and ends with quiet joints and trunk.
 * 2. A reflex may interrupt a wave midway. A voluntary return to standing
 *    must wait for the stroke, and a newly started reflex owns its channels.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Checks actual segment placement, joint displacement and refusal identity.
 * @evidence contracts/development/testing.md#independent-expectations The standing reference supplies the neutral incline and immobile joints.
 * @evidence contracts/development/testing.md#distinguishing-cases Uses voluntary and involuntary next actions at the same authored share.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one body and checks the actual public cuts.
 * @evidence contracts/development/common.md#meaningful-documentation Lists seam continuity and distinct admission branches.
 */
export function test_motion_posture_channel_seam(): void {
  const body = motionHumanBody("m-average");
  const chain = () => HumanChain.subject("performer");
  const plan = (
    input: IAutoMovieMotionHumanChain,
  ): IAutoMovieMotionHumanPerformance =>
    new HumanPerformance({
      seed: "seam",
      performers: [
        {
          subject: "performer",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: input.node,
    });
  const walking = plan(
    chain()
      .stand({ hold: 1 })
      .until({ share: 0.5 })
      .walk({ to: { x: 0, y: 0, z: 3 } })
      .stand(),
  );
  const [, step, rest] = walking.segments("performer");
  const reader = HumanSignature.of(walking, "performer", body, 0);
  const neutral = HumanSignature.trunk(reader, 0);
  const millisecond = 1e-3;
  const millimetre = 1e-3;
  for (const boundary of [step!.entryTime, rest!.entryTime])
    for (const bone of [
      "hips",
      "leftUpperLeg",
      "rightUpperLeg",
      "leftLowerLeg",
      "rightLowerLeg",
      "leftFoot",
      "rightFoot",
    ] as const) {
      const before = HumanSignature.joint(reader, boundary - millisecond, bone);
      const after = HumanSignature.joint(reader, boundary + millisecond, bone);
      TestValidator.predicate(
        `${bone} remains quiet at ${boundary}`,
        Math.hypot(
          after.x - before.x,
          after.y - before.y,
          after.z - before.z,
        ) <= millimetre,
      );
    }
  for (const instant of [
    step!.entryTime + millisecond,
    rest!.entryTime - millisecond,
  ])
    TestValidator.predicate(
      "upright at transition",
      Math.abs(HumanSignature.trunk(reader, instant) - neutral) <= 0.5,
    );
  TestValidator.predicate(
    "trunk leans during the stride",
    HumanSignature.trunk(reader, (step!.entryTime + rest!.entryTime) / 2) -
      neutral >
      0.5,
  );
  const wave = () => chain().gesture({ kind: "wave" }).until({ share: 0.5 });
  TestValidator.equals(
    "involuntary interruption is placed",
    plan(wave().flinch()).segments("performer").length,
    2,
  );
  for (const interrupted of [wave(), chain().flinch().until({ share: 0.05 })]) {
    let refusal: unknown;
    try {
      plan(interrupted.stand());
    } catch (error) {
      refusal = error;
    }
    TestValidator.predicate(
      "voluntary interruption identifies cut and next act",
      refusal instanceof HumanRefusal &&
        refusal.kind === "cut" &&
        refusal.act === "stand",
    );
  }
}
