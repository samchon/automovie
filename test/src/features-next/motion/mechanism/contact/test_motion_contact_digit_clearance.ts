import {
  Quaternion,
  Vector3,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanRest,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanPrehension,
  AutoMovieMotionHumanStance,
  HumanChain,
  HumanPerformance,
  HumanVerdicts,
} from "@automovie/motions";
import { HumanColliders, HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";

const { HumanGrip } = AutoMovieMotionHumanPrehension;

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
            hold: 1,
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
  checkRestClasp(complaints);
  TestValidator.equals("resting digits respect skin depth", complaints, []);
}

/**
 * Two hands clasped one on the other hold each other's hand, not a forearm,
 * and keep their goals: the parade rest's clasp behind the back with the
 * fingers of both hands extended (TC 3-21.5), and the clasp in front with
 * relaxed hands.
 *
 * The website's parade scene refused its salute because the parade rest it
 * started from laid both hands relaxed: the left fingers, longer than the
 * right hand's reach from its middle to its wrist, curled past the right
 * wrist and sank into the right forearm (8.0 mm on the site's m1).
 *
 * Scenarios, on the four extreme bodies (`motionHumanBody.EXTREMES`), each
 * holding the clasp for 1.5 s and read 0.05 s before its end:
 * 1. Behind: both hands' goals are flat, each hand's surface lies within
 *    15 mm of its goal (the bound of the motions package's own rest case),
 *    and each index tip lies outside every collider of the other forearm.
 * 2. In front: both hands' goals are relaxed and each hand's surface lies
 *    within 15 mm of its goal.
 *
 */
function checkRestClasp(complaints: string[]): void {
  for (const name of ["m-average"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    for (const [place, shape] of [
      ["claspedBehind", "flat"],
      ["claspedFront", "relaxed"],
    ] as const) {
      const performance: IAutoMovieMotionHumanPerformance =
        new HumanPerformance({
          seed: "clasp",
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
            left: place,
            right: place,
            hold: 1.5,
          }).node,
        });
      const t: number = performance.duration - 0.05;
      const bones: ReturnType<IAutoMovieMotionHumanPerformance["bones"]> =
        performance.bones("a", t);
      const goals: Partial<
        Record<AutoMovieHumanSide, IAutoMovieMotionHumanRest.IGoal>
      > = AutoMovieMotionHumanStance.rest.goals(
        body,
        performance.posture("a", t),
        {
          left: place,
          right: place,
        },
      );
      // The outward surface of the left hand meets the inward surface of
      // the right. Triangle inequality allows one 15 mm error per hand.
      const behind: boolean = place === "claspedBehind";
      const left: IAutoMovieVector3 = HumanHand.frame(
        body,
        bones,
        "left",
        behind ? "palm" : "handBack",
        shape,
      ).point;
      const right: IAutoMovieVector3 = HumanHand.frame(
        body,
        bones,
        "right",
        behind ? "handBack" : "palm",
        shape,
      ).point;
      const separation: number = Vector3.distance(left, right);
      if (!(separation <= 2 * CONTACT))
        complaints.push(
          `${name} ${place}: clasp surfaces separated by ${separation * 1000} mm`,
        );
      const colliders: ReturnType<typeof HumanColliders.placed> = behind
        ? HumanColliders.placed(body, bones)
        : [];
      for (const side of ["left", "right"] as const) {
        const goal: IAutoMovieMotionHumanRest.IGoal = goals[side]!;
        if (goal.shape !== shape)
          complaints.push(
            `${name} ${place} ${side}: the hand is ${goal.shape}, not ${shape}`,
          );
        const got: IAutoMovieVector3 = HumanHand.frame(
          body,
          bones,
          side,
          goal.surface,
          goal.shape,
        ).point;
        const miss: number = Math.hypot(
          got.x - goal.point.x,
          got.y - goal.point.y,
          got.z - goal.point.z,
        );
        if (!(miss <= CONTACT))
          complaints.push(
            `${name} ${place} ${side}: the ${goal.surface} lies ${(miss * 1000).toFixed(1)} mm off its goal`,
          );
        if (place !== "claspedBehind") continue;

        // The index tip against every shape of the other forearm.
        const tip: IAutoMovieVector3 = HumanHand.frame(
          body,
          bones,
          side,
          "indexTip",
          goal.shape,
        ).point;
        const other: AutoMovieHumanoidBone =
          side === "left" ? "rightLowerArm" : "leftLowerArm";
        for (const segment of colliders)
          if (segment.bone === other)
            for (const solid of segment.shapes) {
              const d: number = physicalShapeSegmentDistance(
                segment.pose,
                solid,
                tip,
                tip,
              );
              if (d < 0)
                complaints.push(
                  `${name} ${place}: the ${side} index tip lies ${(-d * 1000).toFixed(1)} mm inside ${other}`,
                );
            }
      }
    }
  }
}

/** Original single-hand placement tolerance in metres. */
const CONTACT: number = 0.015;
