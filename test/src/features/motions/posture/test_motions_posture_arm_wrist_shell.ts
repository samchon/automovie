import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanArmWristShell
} from "../../../../../packages/motions/src/posture/internal/HumanArmWristShell";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Eight rounded operations at the largest squared distance, nine metres². */
const ROUNDING: number = 8 * 9 * Number.EPSILON;

/**
 * The inner wrist bound uses the hinge's allowable flexion and the maximum
 * wrist displacement possible from its distal spin.
 *
 * Scenarios:
 *
 * 1. Two aligned unit links can fold to a one-metre radius at 120 degrees, since
 *    `2 + 2 cos(120°) = 1`. Mirrored limits give the same radius.
 * 2. Two- and one-metre links reach a one-metre radius at an interior fully folded
 *    hinge.
 * 3. A distal axis perpendicular to the wrist offset can move it by two metres, so
 *    the hinge-only one-metre bound proves no positive radius.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines a conservative inner wrist radius from hinge range and distal rotation excursion.
 * @evidence contracts/development/testing.md#behavioral-verification Computes the bound for aligned, reflected and unequal links and a distal axis perpendicular to the offset.
 * @evidence contracts/development/testing.md#independent-expectations Two unit links at 120° give squared radius 2 + 2 cos 120° = 1. An unequal fully folded pair keeps radius 1, which a maximum distal shift of 2 can eliminate.
 */
export function test_motions_posture_arm_wrist_shell(): void {
  const x: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
  const z: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
  const longitudinal: Parameters<typeof HumanArmWristShell.radius>[2] = {
    flexion: z,
    twist: x,
  };
  TestValidator.predicate(
    "the outermost permitted flexions agree across sides",
    nclose(
      HumanArmWristShell.radius(x, x, longitudinal, { min: 0, max: 120 }),
      1,
      ROUNDING,
    ) &&
      nclose(
        HumanArmWristShell.radius(x, x, longitudinal, { min: -120, max: 0 }),
        1,
        ROUNDING,
      ),
  );
  TestValidator.equals(
    "an interior fully folded hinge is considered",
    HumanArmWristShell.radius({ x: 2, y: 0, z: 0 }, x, longitudinal, {
      min: 120,
      max: 220,
    }),
    1,
  );
  TestValidator.equals(
    "distal spin weakens the bound by its maximum displacement",
    HumanArmWristShell.radius(
      x,
      x,
      { flexion: z, twist: { x: 0, y: 1, z: 0 } },
      { min: 0, max: 120 },
    ),
    0,
  );
}
