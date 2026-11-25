import { affordanceFollowedTravel } from "@automovie/engine";
import type { IAutoMovieAffordanceCoupling } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `affordanceFollowedTravel` is how far a coupled articulation travels for its
 * leader's travel: the leader's travel times a ratio, or a piecewise-linear
 * table clamped to its first and last rows.
 *
 * Scenarios:
 *
 * 1. Ratio 0.5 follows a leader at 4 to 2.
 * 2. Table (0, 0), (1, 10), (3, 20): -1 clamps to 0, 1 reads 10 on a row, 2
 *    interpolates to 15, and 5 clamps to 20.
 */
export function test_unit_engine_validation_affordance_followed_travel(): void {
  const ratio: IAutoMovieAffordanceCoupling = { id: "gear", ratio: 0.5 };
  const table: IAutoMovieAffordanceCoupling = {
    id: "cam",
    table: [
      [0, 0],
      [1, 10],
      [3, 20],
    ],
  };
  TestValidator.equals(
    "the followed travel",
    [
      affordanceFollowedTravel(ratio, 4),
      ...[-1, 1, 2, 5].map((leader: number): number =>
        affordanceFollowedTravel(table, leader),
      ),
    ],
    [2, 0, 10, 15, 20],
  );
}
