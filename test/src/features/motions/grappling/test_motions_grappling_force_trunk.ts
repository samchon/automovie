import type { AutoMovieHumanoidBone, IAutoMovieBone } from "@automovie/interface";
import { HumanForceTrunk } from "@automovie/motions/internal";
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
 * A grappled trunk's side bending: its range toward a side, the spine's and the
 * chest's declared limits together, and the share of it a torque bends through
 * the through-range stiffness of 0.32, 0.83, 2.03 and 5.03 N m per degree by
 * quarter (Watt, Callaway and Williams 2022, Table 6).
 *
 * Scenarios:
 *
 * 1. A spine bending 20 degrees left and 25 right and a chest 10 and 15 range 30
 *    degrees toward the left and 40 toward the right.
 * 2. Over a 40 degree range, 3.2 + 4.15 N m bends through the first quarter and
 *    half the second, 3/8; a torque past the 82.1 N m the range holds bends it
 *    all.
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
