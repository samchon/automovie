import type {
  IAutoMovieMotionHumanPosture,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import {
  humanRomanStance
} from "../../../../../packages/motions/src/lexicon/internal/humanRomanStance";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** A seat at a place, heading +Z. */
const seat = (x: number): IAutoMovieRigidTransform => ({
  position: { x, y: 1.6, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
});

/** Standing at the origin. */
const ENTRY: IAutoMovieMotionHumanPosture = {
  root: { x: 0, y: 0.9, z: 0 },
  yaw: 0,
  pitch: 0,
  roll: 0,
  joints: {},
  limbs: {},
};

/**
 * The `HumanRoman` law's own logic (`humanRomanStance`): a Roman ride stands
 * one foot on each of two seats, the hips a hip height above their middle
 * heading along their mean forward, each knee bent toward a point a shank ahead
 * of and above its foot; the seats may stand from the hips' width to both legs
 * spread 30 degrees apart.
 *
 * Scenarios:
 *
 * 1. Seats at x = 0.3 and x = -0.3, 1.6 m up and heading +Z, put the hips at (0,
 *    2.5, 0) heading 0, the left ankle at (0.3, 1.68, 0) and its knee hint 0.42
 *    m ahead and above it.
 * 2. With 0.1 m hip half width and 0.45 m thigh and 0.42 m shank, the seats may
 *    stand 0.2 m to 0.2 + 0.87 m apart.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines posed root, heading and knee hints for a two-platform circus stance and its admissible support span.
 * @evidence contracts/development/testing.md#behavioral-verification Reads a symmetrical pair of fixed seats and computes span for typed thigh, shank and hip dimensions.
 * @evidence contracts/development/testing.md#independent-expectations The center of the seats plus the stated hip height gives (0, 2.5, 0). The prescribed splay range spans from 0.2 to 1.07 m.
 */
export function test_motions_lexicon_roman(): void {
  const stance: IAutoMovieMotionHumanPosture = humanRomanStance(
    { ankleHeight: 0.08, shank: 0.42, hipHeight: 0.9 },
    ENTRY,
    seat(0.3),
    seat(-0.3),
  );
  TestValidator.predicate(
    "standing across the seats",
    vclose(stance.root, { x: 0, y: 2.5, z: 0 }, 1e-12) &&
      nclose(stance.yaw, 0, 1e-12) &&
      vclose(stance.limbs.leftLeg!.point, { x: 0.3, y: 1.68, z: 0 }, 1e-12) &&
      vclose(stance.limbs.leftLeg!.bend, { x: 0.3, y: 2.02, z: 0.42 }, 1e-12),
  );
  const [narrowest, widest] = humanRomanStance.span({
    thigh: 0.45,
    shank: 0.42,
    hipHalfWidth: 0.1,
  });
  TestValidator.predicate(
    "the legs' span",
    nclose(narrowest, 0.2, 1e-12) && nclose(widest, 0.2 + 0.87, 1e-12),
  );
}
