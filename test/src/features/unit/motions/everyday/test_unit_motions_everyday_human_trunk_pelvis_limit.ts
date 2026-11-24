import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanTrunk } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of a few trigonometric products, degrees. */
const ROUNDING: number = 1e-9;

/**
 * Rounding of a straight knee, degrees: cos at 1 keeps only half the digits
 * of its argument, so a cosine one rounding off 1 reads about a microdegree.
 */
const STRAIGHT: number = 1e-5;

/**
 * `HumanTrunk.pelvisLimit` is the most the pelvis may tilt forward before a
 * planted leg's hip flexion passes `HIP_FLEXION`: each thigh's angle from
 * vertical, its knee bending forward, by the law of cosines on the hip-to-ankle
 * distance, taken from that limit.
 *
 * Scenarios, 0.4 m thighs and shanks, hips 0.09 m either side and 5 cm below a
 * root 1 m up:
 *
 * 1. Standing straight, the ankles 0.8 m below the hips, the thighs are vertical
 *    and the pelvis may tilt the whole `HIP_FLEXION`.
 * 2. Crouched, the ankles 0.4 m below the hips, each knee closes a 60-degree angle
 *    (an equilateral triangle) and the limit is 60 less.
 * 3. Turned 90 degrees, with the ankles on the turned hips, the limit is the
 *    standing one.
 */
export function test_unit_motions_everyday_human_trunk_pelvis_limit(): void {
  const body: Parameters<typeof HumanTrunk.pelvisLimit>[0] = {
    rest: new Map<AutoMovieHumanoidBone, IAutoMovieVector3>([
      ["leftUpperLeg", { x: 0.09, y: -0.05, z: 0 }],
      ["rightUpperLeg", { x: -0.09, y: -0.05, z: 0 }],
    ]),
    measure: { thigh: 0.4, shank: 0.4 },
  };
  const root: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const under: (y: number) => Record<"left" | "right", IAutoMovieVector3> = (
    y: number,
  ): Record<"left" | "right", IAutoMovieVector3> => ({
    left: { x: 0.09, y, z: 0 },
    right: { x: -0.09, y, z: 0 },
  });
  TestValidator.predicate(
    "the limits",
    nclose(
      HumanTrunk.pelvisLimit(body, root, 0, under(0.15)),
      HumanTrunk.HIP_FLEXION,
      STRAIGHT,
    ) &&
      nclose(
        HumanTrunk.pelvisLimit(body, root, 0, under(0.55)),
        Math.max(0, HumanTrunk.HIP_FLEXION - 60),
        ROUNDING,
      ) &&
      nclose(
        HumanTrunk.pelvisLimit(body, root, 90, {
          left: { x: 0, y: 0.15, z: -0.09 },
          right: { x: 0, y: 0.15, z: 0.09 },
        }),
        HumanTrunk.HIP_FLEXION,
        STRAIGHT,
      ),
  );
}
