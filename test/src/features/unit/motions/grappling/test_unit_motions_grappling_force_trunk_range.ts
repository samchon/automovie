import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
} from "@automovie/interface";
import { HumanForceTrunk } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

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
  constraint: {
    flexion: null,
    abduction: { min, max },
    twist: null,
  },
});

/**
 * `HumanForceTrunk.range` is a trunk's side-bending range toward a side: the
 * spine's and the chest's declared abduction limits on that side, together.
 *
 * The spine bends 20 degrees to the left and 25 to the right, the chest 10 and
 * 15.
 *
 * Scenarios:
 *
 * 1. Toward the left the range is 20 + 10 degrees.
 * 2. Toward the right it is 25 + 15 degrees.
 */
export function test_unit_motions_grappling_force_trunk_range(): void {
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
}
