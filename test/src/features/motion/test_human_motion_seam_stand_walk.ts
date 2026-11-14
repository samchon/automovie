import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  HumanSignature,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A walk leaves a quiet stance as that stance and comes to one again: no
 * joint of the legs or the pelvis moves at either cut, and the trunk is
 * upright at both while it inclines in between.
 *
 * A person standing still who begins to walk does not change shape at the
 * instant they decide to: the first weight shift grows out of the stance.
 * A gait whose rules are in force at a standstill (a trunk already inclined,
 * a heel already rising) throws the knee at the cut, because a nearly
 * straight leg turns a millimetre at the ankle into a centimetre at the
 * knee.
 *
 * Scenarios, on the four extreme bodies, each standing 0.5 s, walking 3 m
 * and standing 0.5 s:
 * 1. Across the cut into the walk, from 1 ms before to 1 ms after, the hip,
 *    knee and ankle joint centres of both legs and the pelvis each travel
 *    less than 1 mm (a body at a standstill moves nothing in 2 ms).
 * 2. The same across the cut out of the walk.
 * 3. The trunk's inclination 1 ms after the walk begins and 1 ms before it
 *    ends is within 0.5 degrees of the same body's quiet stance.
 * 4. Midway through the walk the trunk inclines forward of the stance, by
 *    more than 0.5 degrees (a walking trunk leans a few degrees forward,
 *    Thorstensson, Nilsson, Carlson and Zomlefer 1984).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the chain on real bodies and reads displayed joint centres either side of each cut; a knee thrown at the cut or a trunk that snaps to its lean fails.
 * @evidence contracts/development/testing.md#independent-expectations A standstill moves nothing in two milliseconds whatever the law; the lean's presence midway and absence at the ends is how a person starts and stops walking, read by the shipped trunk measure against the same body's stance.
 * @evidence contracts/development/testing.md#distinguishing-cases Both cuts of a walk, the pelvis and both legs, four bodies of extreme proportions.
 * @evidence contracts/development/testing.md#execution-ownership Prepares polygon men, so it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the act, why a seam shows at the knee, and the 4 scenarios.
 */
export function test_human_motion_seam_stand_walk(): void {
  const JOINTS: readonly AutoMovieHumanoidBone[] = [
    "hips",
    "leftUpperLeg",
    "rightUpperLeg",
    "leftLowerLeg",
    "rightLowerLeg",
    "leftFoot",
    "rightFoot",
  ];
  const complaints: string[] = [];
  for (const name of motionHumanBody.EXTREMES) {
    const body: IHumanBody = motionHumanBody(name);
    const performance: HumanPerformance = new HumanPerformance({
      seed: "seam",
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
        .stand({ seconds: 0.5 })
        .walk({ to: { x: 0, y: 0, z: 3 } })
        .stand({ seconds: 0.5 }).node,
    });
    const reader: HumanSignature.IReader = HumanSignature.of(
      performance,
      "a",
      body,
      0,
    );
    const [, walking, standing] = performance.segments("a");
    const cuts: [string, number][] = [
      ["into the walk", walking!.entryTime],
      ["out of the walk", standing!.entryTime],
    ];

    // 1 and 2. Nothing moves across either cut.
    for (const [label, cut] of cuts)
      for (const bone of JOINTS) {
        const a: IAutoMovieVector3 = HumanSignature.joint(
          reader,
          cut - 1e-3,
          bone,
        );
        const b: IAutoMovieVector3 = HumanSignature.joint(
          reader,
          cut + 1e-3,
          bone,
        );
        const moved: number = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
        if (moved > 1e-3)
          complaints.push(
            `${name}: ${bone} travels ${(moved * 1000).toFixed(2)} mm across the cut ${label}, under 1 mm expected`,
          );
      }

    // 3 and 4. Upright at both ends, inclined between.
    const upright: number = HumanSignature.trunk(reader, 0.25);
    for (const [label, t] of [
      ["as the walk begins", walking!.entryTime + 1e-3],
      ["as the walk ends", standing!.entryTime - 1e-3],
    ] as const) {
      const lean: number = HumanSignature.trunk(reader, t) - upright;
      if (Math.abs(lean) > 0.5)
        complaints.push(
          `${name}: the trunk inclines ${lean.toFixed(2)} degrees from the stance ${label}, within 0.5 expected`,
        );
    }
    const midway: number =
      HumanSignature.trunk(
        reader,
        (walking!.entryTime + standing!.entryTime) / 2,
      ) - upright;
    if (!(midway > 0.5))
      complaints.push(
        `${name}: the trunk inclines ${midway.toFixed(2)} degrees midway through the walk, more than 0.5 forward expected`,
      );
  }
  TestValidator.equals("a walk's seams with standing", complaints, []);
}
