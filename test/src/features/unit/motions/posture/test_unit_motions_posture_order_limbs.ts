import type { IAutoMovieHumanLimbGoal } from "@automovie/interface";
import { orderHumanLimbs } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

/** A goal, attached to a bone or not. */
function goal(on?: IAutoMovieHumanLimbGoal["on"]): IAutoMovieHumanLimbGoal {
  return {
    point: { x: 0, y: 1, z: 0.3 },
    bend: { x: 0, y: 1, z: -0.2 },
    ...(on === undefined ? {} : { on }),
  };
}

/**
 * `orderHumanLimbs` is the order limb goals are fitted in: legs, then arms,
 * each after the limb whose bone its goal is attached to (`on`), a limb's bones
 * its chain, its hand or foot and the digits beyond; two limbs attached to each
 * other are refused.
 *
 * Scenarios:
 *
 * 1. Free goals: left leg, right leg, left arm, right arm.
 * 2. The left arm's goal on the right forearm: the right arm before the left.
 * 3. The right leg's goal on a left finger: the left arm first, then the right
 *    leg.
 * 4. A goal on the chest, or on the limb's own hand, orders nothing.
 * 5. The two arms each on the other's forearm are refused, naming both.
 */
export function test_unit_motions_posture_order_limbs(): void {
  // 1. Free.
  TestValidator.equals(
    "legs then arms",
    orderHumanLimbs({ leftArm: goal(), rightLeg: goal() }),
    ["leftLeg", "rightLeg", "leftArm", "rightArm"],
  );

  // 2. An arm on the other arm.
  TestValidator.equals(
    "after the forearm it rests on",
    orderHumanLimbs({ leftArm: goal("rightLowerArm"), rightArm: goal() }),
    ["leftLeg", "rightLeg", "rightArm", "leftArm"],
  );

  // 3. A leg on a finger.
  TestValidator.equals(
    "after the arm whose finger it rests on",
    orderHumanLimbs({ rightLeg: goal("leftIndexProximal") }),
    ["leftLeg", "leftArm", "rightLeg", "rightArm"],
  );

  // 4. No limb's bone.
  TestValidator.equals(
    "a shared or own bone orders nothing",
    orderHumanLimbs({ leftArm: goal("chest"), rightArm: goal("rightHand") }),
    ["leftLeg", "rightLeg", "leftArm", "rightArm"],
  );

  // 5. Crossed attachments.
  TestValidator.predicate(
    "two limbs on each other are refused",
    throwsError(
      (): unknown =>
        orderHumanLimbs({
          leftArm: goal("rightLowerArm"),
          rightArm: goal("leftLowerArm"),
        }),
      ["leftArm", "rightArm", "attached to each other"],
    ),
  );
}
