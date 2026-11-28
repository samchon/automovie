import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanProp,
} from "@automovie/interface";
import {
  climbCaseLadder
} from "../../../../../packages/motions/src/executable/cases/internal/climbCaseLadder";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/**
 * `climbCaseLadder` stages a fixed ladder: ten rungs 0.3 m apart (OSHA
 * 1910.23(b)(2)), 0.41 m long and 30 mm round, 0.35 m ahead of the origin, each
 * rung's frame turning +Y toward the climber at -Z.
 *
 * Scenarios:
 *
 * 1. It is a fixture with rungs `rung1` to `rung10`, rung k 0.3 k m up.
 * 2. Each rung faces -Z and holds a 30 mm power grip 0.41 m long.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines ladder fixture rung names, vertical spacing, contact length, aperture and facing.
 * @evidence contracts/development/testing.md#behavioral-verification Builds the actual climb fixture and reads all ten affordance frames and dimensions.
 * @evidence contracts/development/testing.md#independent-expectations Authored rung k belongs at 0.3k m. The fixture faces each rung toward −Z and independently declares 30 mm aperture and 0.41 m length.
 */
export function test_motions_executable_climb_case_ladder(): void {
  const ladder: IAutoMovieMotionHumanProp = climbCaseLadder();
  const rungs: readonly IAutoMovieAffordance[] = ladder.affordances!;
  TestValidator.predicate(
    "ten rungs 0.3 m apart on a fixture",
    ladder.fixed === true &&
      vclose(ladder.frame.position, { x: 0, y: 0, z: 0.35 }, 1e-12) &&
      rungs.length === 10 &&
      rungs.every(
        (rung: IAutoMovieAffordance, i: number): boolean =>
          rung.id === `rung${i + 1}` &&
          vclose(
            rung.frame.translation,
            { x: 0, y: 0.3 * (i + 1), z: 0 },
            1e-12,
          ),
      ),
  );
  TestValidator.predicate(
    "each rung toward the climber",
    rungs.every(
      (rung: IAutoMovieAffordance): boolean =>
        vclose(
          AutoMovieEngineQuaternion.rotateVector(rung.frame.rotation, { x: 0, y: 1, z: 0 }),
          { x: 0, y: 0, z: -1 },
          1e-12,
        ) &&
        rung.grip === "power" &&
        rung.aperture === 0.03 &&
        rung.length === 0.41,
    ),
  );
}
