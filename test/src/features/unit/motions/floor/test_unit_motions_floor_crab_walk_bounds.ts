import type {
  AutoMovieHumanoidBone,
  IAutoMovieBodyMeasure,
  IAutoMovieBone,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import { HumanRefusal, crabWalkBounds } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of a share of an arch, degrees. */
const ROUNDING: number = 1e-12;

/**
 * `crabWalkBounds` keeps the crab walk within what the body holds: `height`
 * takes a pelvis height between 0.1 statures and 0.6 hip heights, and `arch`
 * shares a trunk extension among the spine, chest and upper chest by the room
 * each extends, refusing more than their sum.
 *
 * Scenarios, for a 1.75 m stature and 0.9 m hip height, and a trunk extending
 * 30, 25 and 20 degrees (75 in all):
 *
 * 1. 0.22 statures is 0.385 m; 0.6 statures (1.05 m, over 0.54 m) and 0.05 are
 *    refused on `height`.
 * 2. A 70 degree arch is 28, 23.33 and 18.67 degrees of extension.
 * 3. An 80 degree arch is refused on `backbend`.
 * 4. A trunk with no constraint has no room: any arch is refused, and none
 *    arches nothing.
 */
export function test_unit_motions_floor_crab_walk_bounds(): void {
  const measure: Pick<IAutoMovieBodyMeasure, "stature" | "hipHeight"> = {
    stature: 1.75,
    hipHeight: 0.9,
  };
  const refused = (run: () => unknown, axis: string): boolean => {
    try {
      run();
    } catch (error: unknown) {
      return error instanceof HumanRefusal && error.axis === axis;
    }
    return false;
  };

  // 1. The height.
  TestValidator.predicate(
    "the height",
    nclose(crabWalkBounds.height(measure, 0.22), 0.385, ROUNDING) &&
      refused(() => crabWalkBounds.height(measure, 0.6), "height") &&
      refused(() => crabWalkBounds.height(measure, 0.05), "height"),
  );

  // 2. The arch.
  const bone = (min: number): Pick<IAutoMovieBone, "constraint"> => ({
    constraint: {
      flexion: { min, max: 60 },
      abduction: null,
      twist: null,
    },
  });
  const trunk: crabWalkBounds.IBones = {
    bones: new Map<AutoMovieHumanoidBone, Pick<IAutoMovieBone, "constraint">>([
      ["spine", bone(-30)],
      ["chest", bone(-25)],
      ["upperChest", bone(-20)],
    ]),
  };
  const arched: IAutoMovieMotionHumanPosture["joints"] = crabWalkBounds.arch(
    trunk,
    70,
  );
  TestValidator.predicate(
    "the shares",
    nclose(arched.spine![0], -28, ROUNDING) &&
      nclose(arched.chest![0], (-70 * 25) / 75, ROUNDING) &&
      nclose(arched.upperChest![0], (-70 * 20) / 75, ROUNDING),
  );

  // 3. Too far.
  TestValidator.predicate(
    "too far",
    refused(() => crabWalkBounds.arch(trunk, 80), "backbend"),
  );

  // 4. No room.
  const free: crabWalkBounds.IBones = { bones: new Map() };
  TestValidator.predicate(
    "no room",
    refused(() => crabWalkBounds.arch(free, 1), "backbend") &&
      Object.keys(crabWalkBounds.arch(free, 0)).length === 0,
  );
}
