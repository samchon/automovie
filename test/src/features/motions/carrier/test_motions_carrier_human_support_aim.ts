import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSupportAim,
  IAutoMovieMotionHumanSupportCarry,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  HumanSupportAim
} from "../../../../../packages/motions/src/carrier/internal/HumanSupportAim";
import {
  HumanSupportCarry
} from "../../../../../packages/motions/src/carrier/internal/HumanSupportCarry";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** Rounding of a few trigonometric products, degrees and metres. */
const ROUNDING: number = 1e-9;

/** The chest's share of the trunk's turn (`AutoMovieMotionHumanTrunk.CHEST`). */
const CHEST: number = 0.6;

/**
 * Check world-fixed aim from a translating or rotating support.
 *
 * Scenarios:
 *
 * 1. For a target 10 m ahead, move the support 1 m right and correct by
 *    atan(-1 / 10) with level pitch. A quarter turn in place needs a
 *    -90-degree correction.
 * 2. Split the sliding correction 60/40 between the chest and spine, turn the
 *    free hand about the root and preserve the bone-held goal.
 * 3. Admit a still support. Refuse the target when a 150-degree support turn
 *    exceeds the aim's bound.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios specify target geometry, posture effects and its refused bound.
 * @evidence contracts/development/testing.md#behavioral-verification Readbacks cover geometry, applied posture and admission under distinct support motion.
 * @evidence contracts/development/testing.md#independent-expectations The expected yaw follows the eye-to-target triangle, and the fixture calculates root-pivot rotation and the authored trunk proportions directly.
 */
export function test_motions_carrier_human_support_aim(): void {
  const aim: IAutoMovieMotionHumanSupportAim.IAim = {
    pivot: { x: 0, y: 1.6, z: 0 },
    target: { x: 0, y: 1.6, z: 10 },
    arms: 30,
  };
  const still: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: AutoMovieEngineQuaternion.identity(),
  };
  const carried: (
    to: IAutoMovieRigidTransform,
  ) => IAutoMovieMotionHumanSupportCarry.ICarry = (
    to: IAutoMovieRigidTransform,
  ): IAutoMovieMotionHumanSupportCarry.ICarry =>
    HumanSupportCarry(
      (seconds: number): IAutoMovieRigidTransform =>
        seconds === 0 ? still : to,
      0,
      1,
    );
  const slid: IAutoMovieMotionHumanSupportCarry.ICarry = carried({
    position: { x: 1, y: 0, z: 0 },
    rotation: AutoMovieEngineQuaternion.identity(),
  });
  const turned: IAutoMovieMotionHumanSupportCarry.ICarry = carried({
    position: { x: 0, y: 0, z: 0 },
    rotation: AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
  });
  const yaw: number = (Math.atan2(-1, 10) * 180) / Math.PI;
  const slide: HumanSupportAim.ICorrection = HumanSupportAim.correction(
    slid,
    aim,
  );
  TestValidator.predicate(
    "the corrections",
    nclose(slide.yaw, yaw, ROUNDING) &&
      nclose(slide.pitch, 0, ROUNDING) &&
      nclose(HumanSupportAim.correction(turned, aim).yaw, -90, ROUNDING),
  );
  const root: IAutoMovieVector3 = { x: 1, y: 0.9, z: 0 };
  const posture: IAutoMovieMotionHumanPosture = {
    root,
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {
      rightArm: {
        point: { x: 1, y: 1.4, z: 0.5 },
        bend: { x: 1, y: 1.1, z: 0.2 },
      },
      leftArm: {
        point: { x: 1.2, y: 1.3, z: 0.1 },
        bend: { x: 1.2, y: 1.1, z: 0 },
        on: "chest",
      },
    },
  };
  const aimed: IAutoMovieMotionHumanPosture = HumanSupportAim.posture(
    slid,
    posture,
    aim,
  );
  const r: number = (yaw * Math.PI) / 180;
  TestValidator.predicate(
    "re-aimed",
    nclose(aimed.joints.chest![2], CHEST * yaw, ROUNDING) &&
      nclose(aimed.joints.spine![2], (1 - CHEST) * yaw, ROUNDING) &&
      vclose(
        aimed.limbs.rightArm!.point,
        { x: 1 + 0.5 * Math.sin(r), y: 1.4, z: 0.5 * Math.cos(r) },
        ROUNDING,
      ) &&
      aimed.limbs.leftArm === posture.limbs.leftArm,
  );
  let axis: string | undefined;
  try {
    HumanSupportAim.check(
      (): IAutoMovieMotionHumanPosture => posture,
      (seconds: number): IAutoMovieMotionHumanSupportCarry.ICarry =>
        HumanSupportCarry(
          (t: number): IAutoMovieRigidTransform => ({
            position: { x: 0, y: 0, z: 0 },
            rotation: AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 150 * t),
          }),
          0,
          seconds,
        ),
      aim,
      1,
    );
  } catch (error: unknown) {
    if (error instanceof AutoMovieMotionHumanRefusal) axis = error.axis;
  }
  TestValidator.equals("past the arms' bound", axis, "target");
  HumanSupportAim.check(
    (): IAutoMovieMotionHumanPosture => posture,
    (): IAutoMovieMotionHumanSupportCarry.ICarry => carried(still),
    aim,
    1,
  );
}
