import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTurnHumanPosture,
  IAutoMovieQuaternion,
} from "@automovie/interface";
import {
  turnHumanPosture
} from "../../../../../packages/motions/src/posture/internal/turnHumanPosture";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";
import { vclose } from "../../internal/vclose";

/** Rounding of one quaternion rotation, metres. */
const ROUNDING: number = 1e-12;

/** A quarter turn about +Y: local +X goes to −Z. */
const QUARTER: IAutoMovieQuaternion = {
  x: 0,
  y: Math.SQRT1_2,
  z: 0,
  w: Math.SQRT1_2,
};

/**
 * `turnHumanPosture` turns a posture's root and world limb goals by its
 * whole-body rotation about the rotation's point; a goal on a bone is kept, a
 * planted world goal refuses the turn unless the rotation keeps it.
 *
 * A quarter turn about +Y through (0, 1, 0).
 *
 * Scenarios:
 *
 * 1. Without a rotation the root and the goals are the posture's own.
 * 2. The root at (1, 1, 0) goes to (0, 1, −1); a world goal at (1, 1, 0) with its
 *    bend at (1, 0, 0) goes to (0, 1, −1) and (0, 0, −1); a goal on a bone is
 *    kept.
 * 3. A planted world goal refuses the turn, and is kept where the rotation says it
 *    is planted.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines whole-body rotation of root and world goals, local bone identity and planted-goal admission.
 * @evidence contracts/development/testing.md#behavioral-verification Runs unrotated and quarter-turn authored poses with world and bone-local goals and an ordinarily planted or explicitly preserved target.
 * @evidence contracts/development/testing.md#independent-expectations A turn about (0, 1, 0) maps (1, 1, 0) to (0, 1, −1). Bone-local data stays equal and an incompatible world plant refuses.
 */
export function test_motions_posture_turn_posture(): void {
  const world: IAutoMovieHumanLimbGoal = {
    point: { x: 1, y: 1, z: 0 },
    bend: { x: 1, y: 0, z: 0 },
  };
  const carried: IAutoMovieHumanLimbGoal = { ...world, on: "chest" };
  const posture: IAutoMovieMotionHumanPosture = {
    root: { x: 1, y: 1, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: { leftArm: world, rightArm: carried },
  };

  // 1. No rotation.
  const plain: IAutoMovieMotionHumanTurnHumanPosture.ITurned =
    turnHumanPosture(posture);
  TestValidator.predicate(
    "without a rotation nothing turns",
    plain.position === posture.root && plain.limbs === posture.limbs,
  );

  // 2. A quarter turn.
  const turned: IAutoMovieMotionHumanTurnHumanPosture.ITurned =
    turnHumanPosture({
      ...posture,
      rotation: { turn: QUARTER, about: { x: 0, y: 1, z: 0 } },
    });
  TestValidator.predicate(
    "the root and the world goal go round, the bone's goal stays",
    vclose(turned.position, { x: 0, y: 1, z: -1 }, ROUNDING) &&
      vclose(turned.limbs.leftArm!.point, { x: 0, y: 1, z: -1 }, ROUNDING) &&
      vclose(turned.limbs.leftArm!.bend, { x: 0, y: 0, z: -1 }, ROUNDING) &&
      turned.limbs.rightArm === carried,
  );

  // 3. A plant.
  const planted: IAutoMovieMotionHumanPosture = {
    ...posture,
    limbs: { leftLeg: { ...world, planted: true } },
  };
  TestValidator.predicate(
    "a plant refuses the turn unless kept",
    throwsError(
      (): IAutoMovieMotionHumanTurnHumanPosture.ITurned =>
        turnHumanPosture({
          ...planted,
          rotation: { turn: QUARTER, about: { x: 0, y: 1, z: 0 } },
        }),
    ) &&
      turnHumanPosture({
        ...planted,
        rotation: { turn: QUARTER, about: { x: 0, y: 1, z: 0 }, planted: true },
      }).limbs.leftLeg === planted.limbs.leftLeg,
  );
}
