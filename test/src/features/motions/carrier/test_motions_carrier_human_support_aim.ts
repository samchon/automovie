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
 * `HumanSupportAim` keeps an aim on a world target from a moving support: the
 * `correction` is the wanted line from the carried pivot to the target against
 * the carried line, its turn about the vertical and its rise; `posture` turns
 * the free arm goals by it about the vertical through the root, the trunk
 * twisting by as much of the turn as its axial range holds, shared 0.6 to the
 * chest; `check` refuses an act whose arms would present the line past the
 * aim's bound.
 *
 * Scenarios, an eye at (0, 1.6, 0) aiming at (0, 1.6, 10):
 *
 * 1. A support that has slid 1 m along +X asks a turn of atan(-1 / 10), -5.711
 *    degrees, and no rise; one that has turned 90 degrees about +Y in place
 *    asks -90.
 * 2. Re-aiming an upright posture by the slide twists the chest by 0.6 and the
 *    spine by 0.4 of the turn and turns a free hand goal about the root's
 *    vertical by it, leaving a goal held on a bone.
 * 3. Over a second's 150-degree turn the arms present the line past a 30-degree
 *    bound, more than the trunk's axial range takes, and are refused on
 *    `target`; a support that stays put is admitted.
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
