import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  pullCoverWay
} from "../../../../../packages/motions/src/floor/internal/pullCoverWay";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/** Rounding of a linear interpolation, metres. */
const ROUNDING: number = 1e-12;

/**
 * Check how a cover moves along a piecewise linear route by travelled
 * distance.
 *
 * Scenarios:
 *
 * 1. Traverse sections of 1 m and 2 m. One third of the total reaches their
 *    corner, and two thirds reaches the midpoint of the second section.
 * 2. Clamp progress before the start and after the end to the authored
 *    endpoints.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios give distance shares at the route's corner and endpoints.
 * @evidence contracts/development/testing.md#behavioral-verification The route uses distance shares across unequal pieces and holds its endpoints outside the range.
 * @evidence contracts/development/testing.md#independent-expectations Cumulative lengths of 1 and 3 m determine the corner and midpoint without invoking the route sampler.
 */
export async function test_motions_floor_pull_cover(): Promise<void> {
  const p = (x: number, y: number): IAutoMovieVector3 => ({ x, y, z: 0 });
  const way: IAutoMovieVector3[] = [p(0, 0), p(1, 0), p(1, 2)];
  TestValidator.predicate(
    "along the way",
    vclose(pullCoverWay(way, 0), p(0, 0), ROUNDING) &&
      vclose(pullCoverWay(way, 1 / 3), p(1, 0), ROUNDING) &&
      vclose(pullCoverWay(way, 2 / 3), p(1, 1), ROUNDING) &&
      vclose(pullCoverWay(way, 1), p(1, 2), ROUNDING),
  );
  TestValidator.predicate(
    "held at the ends",
    vclose(pullCoverWay(way, -1), p(0, 0), ROUNDING) &&
      vclose(pullCoverWay(way, 2), p(1, 2), ROUNDING),
  );
}
