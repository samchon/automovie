import { AutoMovieEngineValidation } from "@automovie/engine";
import type {
  IAutoMovieAffordanceCoupling,
  IAutoMovieAffordanceTravelRange,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

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
 * 3. Finite endpoints and dyadic interior values survive an overflowing
 *    segment width or an out-of-range intermediate product or fraction. An
 *    interior legal domain uses the same forward images to select its bounds.
 * 4. Too few rows, repeated knots or a reversal of follower direction refuse.
 *
 * All admitted examples yield dyadic or integer travel by exact arithmetic.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers inverse travel across gears, monotone cams and partial domains, plus noninvertible input and finite extreme ratios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls affordanceLeadingTravel on signed ratios and literal rising or falling tables at requested interior and endpoint values. Separate table variants exercise invalid inversion.
 * @evidence contracts/development/testing.md#independent-expectations Solving the linear ratio and chosen cam segments gives exact signed, integer or dyadic values. The legal domain maps to its stated endpoints. Constant, repeated or reversing rows cannot identify one leader.
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
      AutoMovieEngineValidation.affordanceLeadingTravel(gear, follower, domain),
    ),
    [null, 1, 2.5, 4, null],
  );
  TestValidator.equals(
    "a constant ratio has no unique inverse",
    AutoMovieEngineValidation.affordanceLeadingTravel({ ...gear, ratio: 0 }, 0),
    null,
  );

  const rising: IAutoMovieAffordanceCoupling = {
    id: "rising-cam",
    table: [
      { leader: 0, follower: 0 },
      { leader: 2, follower: 2 },
      { leader: 6, follower: 8 },
    ],
  };
  const falling: IAutoMovieAffordanceCoupling = {
    id: "falling-cam",
    table: [
      { leader: 0, follower: 8 },
      { leader: 2, follower: 6 },
      { leader: 6, follower: 0 },
    ],
  };
  TestValidator.equals(
    "the rising cam inverts both unequal slopes and admits the table endpoints",
    [-1, 0, 1, 2, 5, 8, 9].map((follower: number): number | null =>
      AutoMovieEngineValidation.affordanceLeadingTravel(rising, follower),
    ),
    [null, 0, 1, 2, 4, 6, null],
  );
  TestValidator.equals(
    "the falling cam intersects its image with the allowed leader range",
    [8, 7, 6, 4.5, 3, 2].map((follower: number): number | null =>
      AutoMovieEngineValidation.affordanceLeadingTravel(falling, follower, domain),
    ),
    [null, 1, 2, 3, 4, null],
  );

  const maximum: number = Number.MAX_VALUE;
  const wideOutput: IAutoMovieAffordanceCoupling = {
    id: "wide-output",
    table: [
      { leader: 0, follower: -maximum },
      { leader: 1, follower: maximum },
    ],
  };
  TestValidator.equals(
    "a finite output span returns its exact endpoints and interior quarters",
    [-maximum, -maximum / 2, 0, maximum / 2, maximum].map(
      (follower: number): number | null =>
        AutoMovieEngineValidation.affordanceLeadingTravel(wideOutput, follower),
    ),
    [0, 0.25, 0.5, 0.75, 1],
  );
  const wideInput: IAutoMovieAffordanceCoupling = {
    id: "wide-input",
    table: [
      { leader: -maximum, follower: 1 },
      { leader: maximum, follower: -1 },
    ],
  };
  TestValidator.equals(
    "a decreasing map returns the exact endpoints of a wide input span",
    [1, 0, -1].map((follower: number): number | null =>
      AutoMovieEngineValidation.affordanceLeadingTravel(wideInput, follower),
    ),
    [-maximum, 0, maximum],
  );
  const power: number = 2 ** 800;
  TestValidator.equals(
    "a finite midpoint survives an overflowing interpolation product",
    AutoMovieEngineValidation.affordanceLeadingTravel(
      {
        id: "wide-product",
        table: [
          { leader: 0, follower: 0 },
          { leader: power, follower: power },
        ],
      },
      power / 2,
    ),
    power / 2,
  );

  const small: number = 2 ** -600;
  const subnormalProductSpan: number = 2 ** -530;
  const subnormalProductQuery: number = 3 * 2 ** -545;
  const smallLeader: number | null = AutoMovieEngineValidation.affordanceLeadingTravel(
    {
      id: "small-product",
      table: [
        { leader: 0, follower: 0 },
        { leader: small, follower: small },
      ],
    },
    small / 2,
  );
  const roundedLeader: number | null = AutoMovieEngineValidation.affordanceLeadingTravel(
    {
      id: "subnormal-product",
      table: [
        { leader: 0, follower: 0 },
        { leader: subnormalProductSpan, follower: subnormalProductSpan },
      ],
    },
    subnormalProductQuery,
  );
  const steepLeader: number | null = AutoMovieEngineValidation.affordanceLeadingTravel(
    {
      id: "small-fraction",
      table: [
        { leader: 0, follower: 0 },
        { leader: 2 ** 30, follower: -(2 ** 10) },
      ],
    },
    -Number.MIN_VALUE,
  );
  TestValidator.predicate(
    "the inverse keeps its exact dyadic value across three underflow cases",
    smallLeader !== null &&
      roundedLeader !== null &&
      steepLeader !== null &&
      nclose(smallLeader, small / 2, 0) &&
      nclose(roundedLeader, subnormalProductQuery, 0) &&
      nclose(steepLeader, 2 ** -1054, 0),
  );

  const halfWidth: number = 2 ** 1023;
  const wideBounds: IAutoMovieAffordanceCoupling = {
    id: "wide-bounds",
    table: [
      { leader: 0, follower: -halfWidth },
      { leader: 1, follower: halfWidth },
    ],
  };
  TestValidator.equals(
    "finite forward images bound a wide output segment's legal interior domain",
    [-halfWidth, -halfWidth / 2, 0, halfWidth / 2, halfWidth].map(
      (follower: number): number | null =>
        AutoMovieEngineValidation.affordanceLeadingTravel(wideBounds, follower, {
          minimum: 0.25,
          maximum: 0.75,
        }),
    ),
    [null, 0.25, 0.5, 0.75, null],
  );
  const wideLeaderBounds: IAutoMovieAffordanceCoupling = {
    id: "wide-leader-bounds",
    table: [
      { leader: -halfWidth, follower: 0 },
      { leader: halfWidth, follower: 1 },
    ],
  };
  TestValidator.equals(
    "wide leader coordinates recover the exact interior domain ends",
    [0, 0.25, 0.5, 0.75, 1].map((follower: number): number | null =>
      AutoMovieEngineValidation.affordanceLeadingTravel(wideLeaderBounds, follower, {
        minimum: -halfWidth / 2,
        maximum: halfWidth / 2,
      }),
    ),
    [null, -halfWidth / 2, 0, halfWidth / 2, null],
  );

  const invalid: NonNullable<IAutoMovieAffordanceCoupling["table"]>[] = [
    [],
    [{ leader: 0, follower: 0 }],
    [
      { leader: 0, follower: 0 },
      { leader: 0, follower: 2 },
      { leader: 6, follower: 8 },
    ],
    [
      { leader: 0, follower: 0 },
      { leader: 2, follower: 0 },
      { leader: 6, follower: 8 },
    ],
    [
      { leader: 0, follower: 0 },
      { leader: 2, follower: 9 },
      { leader: 6, follower: 8 },
    ],
    [
      { leader: 0, follower: 2 },
      { leader: 2, follower: 2 },
    ],
  ];
  TestValidator.equals(
    "non-invertible tables refuse even a request inside their overall range",
    invalid.map((table: (typeof invalid)[number]): number | null =>
      AutoMovieEngineValidation.affordanceLeadingTravel({ id: "cam", table }, 2),
    ),
    [null, null, null, null, null, null],
  );
}
