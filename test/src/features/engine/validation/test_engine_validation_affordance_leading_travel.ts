import { affordanceLeadingTravel } from "@automovie/engine";
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

  const maximum: number = Number.MAX_VALUE;
  const wideOutput: IAutoMovieAffordanceCoupling = {
    id: "wide-output",
    table: [
      [0, -maximum],
      [1, maximum],
    ],
  };
  TestValidator.equals(
    "a finite output span returns its exact endpoints and interior quarters",
    [-maximum, -maximum / 2, 0, maximum / 2, maximum].map(
      (follower: number): number | null =>
        affordanceLeadingTravel(wideOutput, follower),
    ),
    [0, 0.25, 0.5, 0.75, 1],
  );
  const wideInput: IAutoMovieAffordanceCoupling = {
    id: "wide-input",
    table: [
      [-maximum, 1],
      [maximum, -1],
    ],
  };
  TestValidator.equals(
    "a decreasing map returns the exact endpoints of a wide input span",
    [1, 0, -1].map((follower: number): number | null =>
      affordanceLeadingTravel(wideInput, follower),
    ),
    [-maximum, 0, maximum],
  );
  const power: number = 2 ** 800;
  TestValidator.equals(
    "a finite midpoint survives an overflowing interpolation product",
    affordanceLeadingTravel(
      {
        id: "wide-product",
        table: [
          [0, 0],
          [power, power],
        ],
      },
      power / 2,
    ),
    power / 2,
  );

  const small: number = 2 ** -600;
  const subnormalProductSpan: number = 2 ** -530;
  const subnormalProductQuery: number = 3 * 2 ** -545;
  const smallLeader: number | null = affordanceLeadingTravel(
    {
      id: "small-product",
      table: [
        [0, 0],
        [small, small],
      ],
    },
    small / 2,
  );
  const roundedLeader: number | null = affordanceLeadingTravel(
    {
      id: "subnormal-product",
      table: [
        [0, 0],
        [subnormalProductSpan, subnormalProductSpan],
      ],
    },
    subnormalProductQuery,
  );
  const steepLeader: number | null = affordanceLeadingTravel(
    {
      id: "small-fraction",
      table: [
        [0, 0],
        [2 ** 30, -(2 ** 10)],
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
      [0, -halfWidth],
      [1, halfWidth],
    ],
  };
  TestValidator.equals(
    "finite forward images bound a wide output segment's legal interior domain",
    [-halfWidth, -halfWidth / 2, 0, halfWidth / 2, halfWidth].map(
      (follower: number): number | null =>
        affordanceLeadingTravel(wideBounds, follower, {
          minimum: 0.25,
          maximum: 0.75,
        }),
    ),
    [null, 0.25, 0.5, 0.75, null],
  );
  const wideLeaderBounds: IAutoMovieAffordanceCoupling = {
    id: "wide-leader-bounds",
    table: [
      [-halfWidth, 0],
      [halfWidth, 1],
    ],
  };
  TestValidator.equals(
    "wide leader coordinates recover the exact interior domain ends",
    [0, 0.25, 0.5, 0.75, 1].map((follower: number): number | null =>
      affordanceLeadingTravel(wideLeaderBounds, follower, {
        minimum: -halfWidth / 2,
        maximum: halfWidth / 2,
      }),
    ),
    [null, -halfWidth / 2, 0, halfWidth / 2, null],
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
