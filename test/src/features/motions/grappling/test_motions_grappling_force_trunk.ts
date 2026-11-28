import type { AutoMovieHumanoidBone, IAutoMovieBone } from "@automovie/interface";
import {
  HumanForceTrunk
} from "../../../../../packages/motions/src/grappling/internal/HumanForceTrunk";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** A trunk bone's rig record with a declared side-bending range, degrees. */
const trunk = (
  bone: AutoMovieHumanoidBone,
  parent: AutoMovieHumanoidBone,
  min: number,
  max: number,
): IAutoMovieBone => ({
  bone,
  parent,
  rest: {
    translation: { x: 0, y: 0.1, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  },
  constraint: { flexion: null, abduction: { min, max }, twist: null },
});

/**
 * Check side-specific trunk range and torque-driven bending.
 *
 * Scenarios:
 *
 * 1. Sum the specified spine and chest limits to 30 degrees left and 40
 *    degrees right.
 * 2. Over a 40 degree range, 7.35 N m reaches three eighths. Torque beyond
 *    the total stiffness capacity reaches the whole range.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases specify the asymmetric range and partial and saturated bending.
 * @evidence contracts/development/testing.md#behavioral-verification The trunk helper reads two segment limits and evaluates torque at two useful magnitudes.
 * @evidence contracts/development/testing.md#independent-expectations The expected range is a joint-limit sum. The piecewise stiffness yields a 3.2 N m first quarter and 4.15 N m halfway into the next.
 */
export function test_motions_grappling_force_trunk(): void {
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieBone> = new Map([
    ["spine", trunk("spine", "hips", -20, 25)],
    ["chest", trunk("chest", "spine", -10, 15)],
  ]);
  TestValidator.equals(
    "both sides' ranges",
    [
      HumanForceTrunk.range({ bones }, "left"),
      HumanForceTrunk.range({ bones }, "right"),
    ],
    [30, 40],
  );
  TestValidator.predicate(
    "the piecewise-linear stiffness",
    nclose(HumanForceTrunk.share(3.2 + 4.15, 40), 3 / 8, 1e-12) &&
      HumanForceTrunk.share(100, 40) === 1,
  );
}
