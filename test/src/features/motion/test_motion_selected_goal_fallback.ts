import {
  type IAutoMovieResolvedBone,
  closestPointsBetweenSegments,
} from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieJointPose, IAutoMoviePose, IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanVerdicts,
  type IHumanBody,
  type IHumanPosture,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { nclose } from "../internal/nclose";

/**
 * Observational leg selection keeps the complete coupled solve whenever
 * another goal's reference or clearance context prevents independent omission.
 *
 * Scenarios:
 * 1. Both hands rise4cm and move forward5cm while a foot rises5cm.
 *    A reference-bearing arm requires full fallback even when only the foot
 *    is requested; both wrists and the foot still meet their actual goals.
 * 2. Selecting either wrist retains both arms and the leg. The forearms keep
 *    the actual body's two-radius separation less its existing skin allowance,
 *    and full-cold joint/seed geometry remains numerically unchanged.
 * 3. A leg-only world goal remains correctly observed when independent
 *    omission is legal; the full raw goal record is retained for its caller.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States canonical Human provenance, actual metre targets, reference/rival-arm dependency boundary, requested-field/full-fallback distinction and existing contact/skin bounds in three scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Runs public seeded with requested foot/left hand/right hand beside ordinary full resolution, reads actual full FK wrist/foot contacts and forearm clearance, and compares complete cold clinical outputs only in contexts promised to retain the full solve.
 * @evidence contracts/development/testing.md#independent-expectations Small upward/forward goals are literal world offsets from the canonical resting joints and remain within the limbs' reachable shells. Each actual endpoint must meet its requested point within0.001m. Two forearm capsules require the body's own two radii less HumanVerdicts.SKIN; cold parity supplements these physical checks rather than supplying their target or clearance bounds.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers a requested leg with unsupported reference-bearing rival-arm context, either requested arm with both goals present, unchanged all-joint fallback, actual capsule separation and the adjacent legal leg-only selection. Attached/normal/digit contexts have their existing owners; this test adds no new tolerance.
 * @evidence contracts/development/testing.md#execution-ownership One portable discoverable unit borrows the unchanged canonical Human fixture and owns all raw goals/poses. It invokes only real public resolver/FK/distance APIs, starts no host/compiler and replaces no foreign operation or global.
 */
export function test_motion_selected_goal_fallback(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const raw: IHumanPosture = { root: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0, roll: 0, joints: {}, limbs: {} };
  const rest: IAutoMoviePose = resolveHumanPosture(body, raw);
  const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = indexed(rest, body);
  const left: IAutoMovieVector3 = bones.get("leftHand")!.worldPosition;
  const right: IAutoMovieVector3 = bones.get("rightHand")!.worldPosition;
  const foot: IAutoMovieVector3 = bones.get("leftFoot")!.worldPosition;
  const goals: IHumanPosture["limbs"] = {
    leftArm: {
      point: { x: left.x, y: left.y + 0.04, z: left.z + 0.05 },
      bend: { ...bones.get("leftLowerArm")!.worldPosition },
      reference: resolveHumanPosture.reference(rest, "leftArm"),
    },
    rightArm: {
      point: { x: right.x, y: right.y + 0.04, z: right.z + 0.05 },
      bend: { ...bones.get("rightLowerArm")!.worldPosition },
    },
    leftLeg: {
      point: { x: foot.x, y: foot.y + 0.05, z: foot.z + 0.04 },
      bend: { x: bones.get("leftLowerLeg")!.worldPosition.x,
        y: bones.get("leftLowerLeg")!.worldPosition.y,
        z: bones.get("leftLowerLeg")!.worldPosition.z + 0.3 },
    },
  };
  const posture: IHumanPosture = { ...raw, limbs: goals };
  const full: IAutoMoviePose = resolveHumanPosture(body, posture);
  for (const name of ["leftFoot", "leftHand", "rightHand"] as const) {
    const actual: IAutoMoviePose = resolveHumanPosture.seeded(body, posture,
      undefined, undefined, undefined, new Set([name])).pose;
    sameJoints(actual, full);
    const shown: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = indexed(actual, body);
    for (const [limb, bone] of [["leftArm", "leftHand"], ["rightArm", "rightHand"], ["leftLeg", "leftFoot"]] as const) {
      const point: IAutoMovieVector3 = shown.get(bone)!.worldPosition;
      const target: IAutoMovieVector3 = goals[limb]!.point;
      TestValidator.predicate("required complete fallback retains every current physical task",
        Math.hypot(point.x - target.x, point.y - target.y, point.z - target.z) <= 0.001,
      );
    }
    const separation: number = closestPointsBetweenSegments(
      shown.get("leftLowerArm")!.worldPosition, shown.get("leftHand")!.worldPosition,
      shown.get("rightLowerArm")!.worldPosition, shown.get("rightHand")!.worldPosition,
    ).distance;
    TestValidator.predicate("both actual forearms retain their rival-arm clearance",
      separation >= 2 * body.measure.forearmRadius - HumanVerdicts.SKIN,
    );
  }
  const independent: IHumanPosture = { ...raw, limbs: { leftLeg: goals.leftLeg! } };
  const selected: IAutoMoviePose = resolveHumanPosture.seeded(body, independent,
    undefined, undefined, undefined, new Set(["leftFoot"])).pose;
  const current: IAutoMovieVector3 = indexed(selected, body).get("leftFoot")!.worldPosition;
  const target: IAutoMovieVector3 = goals.leftLeg!.point;
  TestValidator.predicate("legal independent leg selection still meets its actual asked point",
    Math.hypot(current.x - target.x, current.y - target.y, current.z - target.z) <= 0.001 &&
    independent.limbs.leftLeg === goals.leftLeg,
  );
}

/** Observe ordinary canonical FK with no selected-output shortcut. */
function indexed(pose: IAutoMoviePose, body: IHumanBody): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
  return poseBones(body, pose);
}

/** Full-fallback contexts preserve every actual cold clinical coordinate. */
function sameJoints(actual: IAutoMoviePose, expected: IAutoMoviePose): void {
  TestValidator.predicate("conservative fallback preserves the complete cold joint solve",
    actual.joints.length === expected.joints.length && actual.joints.every(
      (value: IAutoMovieJointPose, i: number): boolean => {
        const other: IAutoMovieJointPose = expected.joints[i]!;
        return value.bone === other.bone && same(value.flexion, other.flexion) &&
          same(value.abduction, other.abduction) && same(value.twist, other.twist);
      }),
  );
}

/** Preserve null rest independently from degree-valued cold parity. */
function same(a: number | null, b: number | null): boolean {
  return a === null || b === null ? a === b : nclose(a, b, 1e-7);
}
