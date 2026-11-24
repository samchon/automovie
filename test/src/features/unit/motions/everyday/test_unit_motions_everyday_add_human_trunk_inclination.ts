import type { IAutoMovieMotionHumanPosture } from "@automovie/interface";
import { addHumanTrunkInclination } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of one product and sum, degrees. */
const ROUNDING: number = 1e-12;

/**
 * `addHumanTrunkInclination` adds a bone's share of the spine's flexion to its
 * flexion, keeping its abduction and twist.
 *
 * Scenarios:
 *
 * 1. A spine at (2, 3, -1) given 0.4 of a 10-degree flexion is at (6, 3, -1).
 * 2. A chest the record leaves out takes its share from zero: 0.6 of 10 is
 *    (6, 0, 0).
 */
export function test_unit_motions_everyday_add_human_trunk_inclination(): void {
  const joints: IAutoMovieMotionHumanPosture["joints"] = { spine: [2, 3, -1] };
  addHumanTrunkInclination(joints, "spine", 0.4, 10);
  addHumanTrunkInclination(joints, "chest", 0.6, 10);
  TestValidator.predicate(
    "the spine's share added",
    nclose(joints.spine![0], 6, ROUNDING) &&
      joints.spine![1] === 3 &&
      joints.spine![2] === -1,
  );
  TestValidator.predicate(
    "the chest's share from zero",
    nclose(joints.chest![0], 6, ROUNDING) &&
      joints.chest![1] === 0 &&
      joints.chest![2] === 0,
  );
}
