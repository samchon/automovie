import { affordanceLeadingTravel } from "@automovie/engine";
import type {
  IAutoMovieAffordanceCoupling,
  IAutoMovieAffordanceTravelRange,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A coupled travel is reversible only when the forward map has one leader for
 * the requested follower, including both legal domain endpoints.
 *
 * Scenarios:
 *
 * 1. A signed gear ratio gives the exact inverse and refuses requests outside its
 *    legal image. A zero ratio has no unique inverse.
 * 2. Increasing and decreasing cams invert in the correct segment and return exact
 *    table and domain endpoints.
 * 3. Too few rows, repeated knots or a reversal of follower direction refuse.
 *
 * All admitted examples yield dyadic or integer travel by exact arithmetic.
 */
export function test_engine_validation_affordance_leading_travel(): void {
  const gear: IAutoMovieAffordanceCoupling = { id: "gear", ratio: -2 };
  const domain: IAutoMovieAffordanceTravelRange.IResult = {
    minimum: 1,
    maximum: 4,
  };
  TestValidator.equals(
    "the inverse of -2 times the leader holds only on the legal image",
    [-1, -2, -5, -8, -9].map((follower: number): number | null =>
      affordanceLeadingTravel(gear, follower, domain),
    ),
    [null, 1, 2.5, 4, null],
  );
  TestValidator.equals(
    "a constant ratio has no unique inverse",
    affordanceLeadingTravel({ ...gear, ratio: 0 }, 0),
    null,
  );

  const rising: IAutoMovieAffordanceCoupling = {
    id: "rising-cam",
    table: [
      [0, 0],
      [2, 2],
      [6, 8],
    ],
  };
  const falling: IAutoMovieAffordanceCoupling = {
    id: "falling-cam",
    table: [
      [0, 8],
      [2, 6],
      [6, 0],
    ],
  };
  TestValidator.equals(
    "the rising cam inverts both unequal slopes and admits the table endpoints",
    [-1, 0, 1, 2, 5, 8, 9].map((follower: number): number | null =>
      affordanceLeadingTravel(rising, follower),
    ),
    [null, 0, 1, 2, 4, 6, null],
  );
  TestValidator.equals(
    "the falling cam intersects its image with the allowed leader range",
    [8, 7, 6, 4.5, 3, 2].map((follower: number): number | null =>
      affordanceLeadingTravel(falling, follower, domain),
    ),
    [null, 1, 2, 3, 4, null],
  );

  const invalid: NonNullable<IAutoMovieAffordanceCoupling["table"]>[] = [
    [],
    [[0, 0]],
    [
      [0, 0],
      [0, 2],
      [6, 8],
    ],
    [
      [0, 0],
      [2, 0],
      [6, 8],
    ],
    [
      [0, 0],
      [2, 9],
      [6, 8],
    ],
    [
      [0, 2],
      [2, 2],
    ],
  ];
  TestValidator.equals(
    "non-invertible tables refuse even a request inside their overall range",
    invalid.map((table: (typeof invalid)[number]): number | null =>
      affordanceLeadingTravel({ id: "cam", table }, 2),
    ),
    [null, null, null, null, null, null],
  );
}
