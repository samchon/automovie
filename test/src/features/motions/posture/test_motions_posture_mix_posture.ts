import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
} from "@automovie/interface";
import {
  mixHumanPosture
} from "../../../../../packages/motions/src/posture/internal/mixHumanPosture";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** Rounding of a few products and one slerp. */
const ROUNDING: number = 1e-12;

/** A limb goal at a point, planted or not. */
function goal(x: number, planted: boolean): IAutoMovieHumanLimbGoal {
  return {
    point: { x, y: 1, z: 0 },
    bend: { x, y: 1, z: -0.5 },
    planted,
  };
}

/** The posture without the layer. */
const FROM: IAutoMovieMotionHumanPosture = {
  root: { x: 0, y: 0.9, z: 0 },
  yaw: 10,
  pitch: 0,
  roll: 0,
  joints: { spine: [10, 0, 0], neck: [4, 0, 0] },
  limbs: { leftArm: goal(0, true), rightLeg: goal(0.2, true) },
};

/** The posture with it. */
const TO: IAutoMovieMotionHumanPosture = {
  root: { x: 1, y: 0.8, z: 2 },
  yaw: 50,
  pitch: 20,
  roll: -10,
  joints: { spine: [30, 10, 0], head: [8, 0, 0] },
  limbs: { leftArm: goal(1, false), rightArm: goal(-1, false) },
  rotation: {
    about: { x: 0, y: 1, z: 0 },
    turn: AutoMovieEngineQuaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
  },
};

/**
 * `mixHumanPosture` is an additive layer's weight: the root, heading and every
 * joint angle move linearly by it, a joint only one sets counting as zero in
 * the other; a limb goal both set moves its point and bend and keeps the rest
 * of `from`'s (its planting); one only one sets is kept as it is; a whole-body
 * turn slerps from the identity; the ends are the postures themselves.
 *
 * Scenarios, at a quarter:
 *
 * 1. Weights 0 and 1, and past them, give the postures themselves.
 * 2. The root at (0.25, 0.875, 0.5), heading 20, pitch 5, roll −2.5; the spine at
 *    (15, 2.5, 0), the neck at 3 and the head at 2, each from zero.
 * 3. The left arm's goal a quarter of the way at x = 0.25, still planted as `from`
 *    holds it; the right leg and right arm kept as their one side has them.
 * 4. The turn a quarter of the way to 90 degrees, 22.5 degrees about +X.
 */
export function test_motions_posture_mix_posture(): void {
  // 1. The ends.
  TestValidator.predicate(
    "the postures themselves at and past the ends",
    mixHumanPosture(FROM, TO, 0) === FROM &&
      mixHumanPosture(FROM, TO, -1) === FROM &&
      mixHumanPosture(FROM, TO, 1) === TO &&
      mixHumanPosture(FROM, TO, 2) === TO,
  );

  // 2. Linear fields.
  const q: IAutoMovieMotionHumanPosture = mixHumanPosture(FROM, TO, 0.25);
  TestValidator.predicate(
    "the root, heading and joints a quarter of the way",
    vclose(q.root, { x: 0.25, y: 0.875, z: 0.5 }, ROUNDING) &&
      nclose(q.yaw, 20, ROUNDING) &&
      nclose(q.pitch, 5, ROUNDING) &&
      nclose(q.roll, -2.5, ROUNDING) &&
      q.joints.spine!.every((v: number, i: number): boolean =>
        nclose(v, [15, 2.5, 0][i]!, ROUNDING),
      ) &&
      nclose(q.joints.neck![0], 3, ROUNDING) &&
      nclose(q.joints.head![0], 2, ROUNDING),
  );

  // 3. Limb goals.
  TestValidator.predicate(
    "the shared goal moved and still held, the others kept",
    nclose(q.limbs.leftArm!.point.x, 0.25, ROUNDING) &&
      nclose(q.limbs.leftArm!.bend.x, 0.25, ROUNDING) &&
      q.limbs.leftArm!.planted === true &&
      q.limbs.rightLeg === FROM.limbs.rightLeg &&
      q.limbs.rightArm === TO.limbs.rightArm,
  );

  // 4. The turn.
  const turn: IAutoMovieQuaternion = q.rotation!.turn;
  TestValidator.predicate(
    "the turn slerped from the identity",
    Math.abs(
      Math.abs(
        turn.x * Math.sin(Math.PI / 16) + turn.w * Math.cos(Math.PI / 16),
      ) - 1,
    ) <= ROUNDING,
  );
}
