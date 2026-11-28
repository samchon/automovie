import { AutoMovieEngineValidation } from "@automovie/engine";
import type { IAutoMovieAffordanceCoupling } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

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
 * 3. Dyadic tables retain exact travel when the product, the fraction, or a
 *    knot span falls outside binary64's normal range.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers ratio travel, table knots and clamping, and exact dyadic interpolation at binary64 extremes.
 * @evidence contracts/development/testing.md#behavioral-verification Calls affordanceFollowedTravel with a ratio, a hand-written cam table and extreme finite dyadic inputs.
 * @evidence contracts/development/testing.md#independent-expectations The ratio case gives two. The clamped table has endpoints zero and twenty, a knot at ten and an interior value fifteen. Exact powers of two independently expose premature underflow or overflowing spans.
 */
export function test_engine_validation_affordance_followed_travel(): void {
  const ratio: IAutoMovieAffordanceCoupling = { id: "gear", ratio: 0.5 };
  const table: IAutoMovieAffordanceCoupling = {
    id: "cam",
    table: [
      { leader: 0, follower: 0 },
      { leader: 1, follower: 10 },
      { leader: 3, follower: 20 },
    ],
  };
  TestValidator.equals(
    "the followed travel",
    [
      AutoMovieEngineValidation.affordanceFollowedTravel(ratio, 4),
      ...[-1, 1, 2, 5].map((leader: number): number =>
        AutoMovieEngineValidation.affordanceFollowedTravel(table, leader),
      ),
    ],
    [2, 0, 10, 15, 20],
  );

  const small: number = 2 ** -600;
  const high: number = 2 ** 1023;
  TestValidator.predicate(
    "the half-travel identity survives a product below the least subnormal",
    nclose(
      AutoMovieEngineValidation.affordanceFollowedTravel(
        {
          id: "small",
          table: [
            { leader: 0, follower: 0 },
            { leader: small, follower: small },
          ],
        },
        small / 2,
      ),
      small / 2,
      0,
    ),
  );
  TestValidator.predicate(
    "a slope of 2^20 amplifies one least subnormal before it rounds away",
    nclose(
      AutoMovieEngineValidation.affordanceFollowedTravel(
        {
          id: "steep",
          table: [
            { leader: 0, follower: 0 },
            { leader: 2 ** 10, follower: -(2 ** 30) },
          ],
        },
        Number.MIN_VALUE,
      ),
      -(2 ** -1054),
      0,
    ),
  );
  TestValidator.predicate(
    "opposing extremes interpolate at the midpoint and third quarter",
    [0, high / 2].every((leading: number): boolean =>
      nclose(
        AutoMovieEngineValidation.affordanceFollowedTravel(
          {
            id: "wide",
            table: [
              { leader: -high, follower: high },
              { leader: high, follower: -high },
            ],
          },
          leading,
        ),
        -leading,
        0,
      ),
    ),
  );
}
