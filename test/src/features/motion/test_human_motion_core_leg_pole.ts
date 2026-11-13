import type { IAutoMoviePose, IAutoMovieVector3 } from "@automovie/interface";
import {
  type IHumanBody,
  type IHumanPosture,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A leg goal's bend point states the knee's plane: with the ankle placed a
 * shank below a knee that lies a thigh from the hip, the fitted knee is on
 * that point, also when the point is to the side of the hip
 * (`IHumanPosture.IGoal.bend`: the world point the middle joint bends
 * toward).
 *
 * One body, the average man, standing at the origin; the right leg is given
 * one goal and the posture resolved once.
 *
 * Scenarios, the knee asked a thigh from the right hip joint, 0.85 of the
 * thigh ahead of it and the rest below, the ankle a shank straight below
 * the knee:
 * 1. In the hip's own fore-and-aft plane: the fitted knee lies within 5 mm
 *    of the bend point (the campaign's bound for a planted joint).
 * 2. The same knee swung 65 mm outward about the hip, the ankle below it:
 *    the fitted knee lies within 5 mm of the bend point.
 *
 * Each complaint states the knee's displacement from the point by axis and
 * the hip's three fitted angles, so a range that refuses the plane and a fit
 * that ignores the point read differently.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Resolves a standing posture with one leg goal through the public resolver and reads the displayed knee; a knee off a consistent bend point fails.
 * @evidence contracts/development/testing.md#independent-expectations The knee's place is built from the body's own rest joints and lengths, so it lies on the circle the two segments allow; the 5 mm is the campaign's bound.
 * @evidence contracts/development/testing.md#distinguishing-cases The bend point in the hip's plane against the same point 65 mm to the side.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and resolves two postures; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule with its source, the construction, the 2 scenarios and what each complaint carries.
 */
export function test_human_motion_core_leg_pole(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const standing: IHumanPosture = stand.posture(
    body,
    { x: 0, y: 0, z: 0 },
    0,
  );
  const mm = (metres: number): string => (metres * 1000).toFixed(0);
  const at = (
    pose: IAutoMoviePose,
    bone: "rightUpperLeg" | "rightLowerLeg",
  ): IAutoMovieVector3 => poseBones(body, pose).get(bone)!.worldPosition;
  const hip: IAutoMovieVector3 = at(
    resolveHumanPosture(body, standing),
    "rightUpperLeg",
  );
  const thigh: number = Math.hypot(
    body.rest.get("rightLowerLeg")!.x - body.rest.get("rightUpperLeg")!.x,
    body.rest.get("rightLowerLeg")!.y - body.rest.get("rightUpperLeg")!.y,
    body.rest.get("rightLowerLeg")!.z - body.rest.get("rightUpperLeg")!.z,
  );
  const shank: number = Math.hypot(
    body.rest.get("rightFoot")!.x - body.rest.get("rightLowerLeg")!.x,
    body.rest.get("rightFoot")!.y - body.rest.get("rightLowerLeg")!.y,
    body.rest.get("rightFoot")!.z - body.rest.get("rightLowerLeg")!.z,
  );
  const complaints: string[] = [];
  for (const [label, side] of [
    ["in the hip's plane", 0],
    ["65 mm outward", 0.065],
  ] as const) {
    // The performer's right is -X.
    const ahead: number = 0.85 * thigh;
    const knee: IAutoMovieVector3 = {
      x: hip.x - side,
      y: hip.y - Math.sqrt(thigh ** 2 - ahead ** 2 - side ** 2),
      z: hip.z + ahead,
    };
    const pose: IAutoMoviePose = resolveHumanPosture(body, {
      ...standing,
      limbs: {
        ...standing.limbs,
        rightLeg: {
          point: { x: knee.x, y: knee.y - shank, z: knee.z },
          bend: knee,
        },
      },
    });
    const fitted: IAutoMovieVector3 = at(pose, "rightLowerLeg");
    const off: number = Math.hypot(
      fitted.x - knee.x,
      fitted.y - knee.y,
      fitted.z - knee.z,
    );
    if (!(off <= 0.005)) {
      const joint = pose.joints.find(
        (j): boolean => j.bone === "rightUpperLeg",
      );
      complaints.push(
        `${label}: the fitted knee lies ${mm(off)} mm from the bend point (${mm(fitted.x - knee.x)} mm left, ${mm(fitted.y - knee.y)} mm above, ${mm(fitted.z - knee.z)} mm ahead of it), within 5 mm expected; the hip is fitted at flexion ${(joint?.flexion ?? NaN).toFixed(1)}, abduction ${(joint?.abduction ?? NaN).toFixed(1)}, twist ${(joint?.twist ?? NaN).toFixed(1)} degrees`,
      );
    }
  }
  TestValidator.equals("a leg goal's bend point", complaints, []);
}
