import {
  StrikingWeaponGirth
} from "../../../../../packages/motions/src/striking/internal/StrikingWeaponGirth";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * A striking limb's girth (`StrikingWeaponGirth`): each segment's radius runs
 * linearly from its root to its tip; the leg's runs thigh to shank to a foot
 * half the ankle's height, the arm's upper arm to forearm.
 *
 * Scenarios:
 *
 * 1. Halfway from 0.06 to 0.04 m the girth is 0.05 m.
 * 2. A thigh of 0.08, a shank of 0.05 and an ankle 0.08 m high give the leg 0.08
 *    to 0.05, 0.05 to 0.04 and 0.04 throughout the foot.
 * 3. An upper arm of 0.05 and a forearm of 0.035 give the arm 0.05 to 0.035, then
 *    0.035 throughout.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines interpolation of virtual collider girth and derived segments for a leg and arm.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the midpoint of two endpoint radii and builds rig girth records from authored limb sizes.
 * @evidence contracts/development/testing.md#independent-expectations The midpoint is 0.05 m. Half the given ankle height is 0.04 m, and the equal terminal radii keep the foot and forearm constant.
 */
export function test_motions_striking_weapon_girth(): void {
  TestValidator.predicate(
    "linear",
    nclose(StrikingWeaponGirth.girth([0.06, 0.04], 0.5), 0.05, 1e-12),
  );
  TestValidator.equals(
    "the leg",
    StrikingWeaponGirth.legRadii({
      measure: { thighRadius: 0.08, shankRadius: 0.05, ankleHeight: 0.08 },
    }),
    [
      [0.08, 0.05],
      [0.05, 0.04],
      [0.04, 0.04],
    ],
  );
  TestValidator.equals(
    "the arm",
    StrikingWeaponGirth.armRadii({
      measure: { upperArmRadius: 0.05, forearmRadius: 0.035 },
    }),
    [
      [0.05, 0.035],
      [0.035, 0.035],
      [0.035, 0.035],
    ],
  );
}
