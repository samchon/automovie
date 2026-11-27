import {
  StrikingLimb
} from "../../../../../packages/motions/src/executable/cases/StrikingLimb";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** How near a signed distance comes to its closed form, metres. */
const EXACT: number = 1e-12;

/** A capsule of radius 0.1 m along x from 0 to 1 m. */
const UNIFORM: StrikingLimb.ICapsule = {
  name: "uniform",
  a: { x: 0, y: 0, z: 0 },
  b: { x: 1, y: 0, z: 0 },
  radius: 0.1,
  tail: 0.1,
};

/**
 * The striking captures' limbs: the joint a limb hangs from, its bare reach by
 * the body's segments, and the signed distance to a tapered capsule.
 *
 * Scenarios:
 *
 * 1. A left foot hangs from the left upper leg and is a leg; a right hand hangs
 *    from the right upper arm and is not.
 * 2. With a 0.45 m thigh of 0.08 m radius, a 0.42 m shank and a 0.26 m foot, a
 *    kick reaches the three, 1.13 m, and a knee the thigh and its radius, 0.53
 *    m.
 * 3. On the uniform capsule, a point 2 m along the axis lies 0.9 m past its end
 *    cap; on one tapering from 0.1 to 0.2 m, a point 1 m off its middle lies
 *    `sqrt(1 - k²) - r0 - k s` = `sqrt(0.99) - 0.1 - 0.05` m out.
 */
export function test_motions_executable_striking_limb(): void {
  TestValidator.equals(
    "the roots and the legs",
    [
      StrikingLimb.root("leftFoot"),
      StrikingLimb.leg("leftFoot"),
      StrikingLimb.root("rightHand"),
      StrikingLimb.leg("rightHand"),
    ],
    ["leftUpperLeg", true, "rightUpperArm", false],
  );
  const body: Parameters<typeof StrikingLimb.length>[0] = {
    measure: {
      upperArm: 0.3,
      forearm: 0.26,
      hand: 0.19,
      thigh: 0.45,
      shank: 0.42,
      footLength: 0.26,
      thighRadius: 0.08,
    },
  };
  TestValidator.predicate(
    "the bare reaches",
    nclose(StrikingLimb.length(body, "leftFoot", false), 1.13, EXACT) &&
      nclose(StrikingLimb.length(body, "rightFoot", true), 0.53, EXACT),
  );
  TestValidator.predicate(
    "the capsule's signed distance",
    nclose(StrikingLimb.surface({ x: 2, y: 0, z: 0 }, UNIFORM), 0.9, EXACT) &&
      nclose(
        StrikingLimb.surface(
          { x: 0.5, y: 0, z: 1 },
          { ...UNIFORM, name: "taper", tail: 0.2 },
        ),
        Math.sqrt(0.99) - 0.1 - 0.05,
        EXACT,
      ),
  );
}
