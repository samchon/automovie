import {
  Quaternion,
  Vector3,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanColliders,
  HumanGrip,
  HumanPerformance,
  HumanVerdicts,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A resting finger capsule may indent adjoining skin only by the physical skin allowance.
 * Scenarios:
 * 1. Place the resting fingers against the hip or thigh and measure each capsule against neighboring skin.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Measures the five finger chains at the end of the pocket, hip and side rests.
 * @evidence contracts/development/testing.md#behavioral-verification Performs each rest on the average body and reads the displayed phalanges against the other body colliders.
 * @evidence contracts/development/testing.md#independent-expectations The rest cannot push a phalanx deeper than the common skin allowance, independent of the rest goals.
 * @evidence contracts/development/testing.md#distinguishing-cases Pocket, hip and lateral thigh place the hand against distinct nearby surfaces.
 * @evidence contracts/development/testing.md#execution-ownership Each of three rest performances supplies one FK map to all five digits.
 */
export function test_motion_contact_digit_clearance(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const complaints: string[] = [];
  // A hand at rest on the body lays its digits on it: no phalanx of the
  // resting hand lies deeper in another part of the body than the skin's
  // give, for each place a hand rests against the thigh or hip.
  for (const place of ["pocket", "hip", "side"] as const)
    try {
      const performance: IAutoMovieMotionHumanPerformance =
        new HumanPerformance({
          seed: "digits",
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
          ],
          composition: HumanChain.subject("a").rest({
            right: place,
            seconds: 1,
          }).node,
        });
      const bones = performance.bones("a", performance.duration - 0.05);
      const others: readonly IAutoMovieMotionHumanColliders.IPlaced[] =
        HumanColliders.placed(body, bones).filter(
          (p: IAutoMovieMotionHumanColliders.IPlaced): boolean =>
            !/^right(Hand|Thumb|Index|Middle|Ring|Little|LowerArm)/.test(
              p.bone,
            ),
        );
      for (const digit of [
        "Thumb",
        "Index",
        "Middle",
        "Ring",
        "Little",
      ] as const) {
        const chain = HumanGrip.chain(body, "right", digit);
        const points: IAutoMovieVector3[] = chain.bones.map(
          (b) => bones.get(b)!.worldPosition,
        );
        const last = bones.get(chain.bones.at(-1)!)!;
        points.push(
          Vector3.add(
            last.worldPosition,
            Quaternion.rotateVector(last.worldRotation, chain.tip),
          ),
        );
        let deepest: number = 0;
        let into: string = "";
        for (const p of others)
          for (const shape of p.shapes)
            points.slice(1).forEach((b: IAutoMovieVector3, i: number): void => {
              const depth: number =
                chain.radius -
                physicalShapeSegmentDistance(p.pose, shape, points[i]!, b);
              if (depth > deepest) {
                deepest = depth;
                into = p.bone;
              }
            });
        if (!(deepest <= HumanVerdicts.SKIN))
          complaints.push(
            `rest at ${place}: the right ${digit.toLowerCase()} lies ${(deepest * 1000).toFixed(1)} mm in ${into}, within the skin's ${HumanVerdicts.SKIN * 1000} mm expected`,
          );
      }
    } catch (error) {
      complaints.push(
        `rest at ${place}: expected to plan, got ${(error as Error).message}`,
      );
    }
  TestValidator.equals("resting digits respect skin depth", complaints, []);
}
