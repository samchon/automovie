import { AutoMovieEngineResolve } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/**
 * `blendVec` is the linear interpolation `a + (b − a) t`.
 *
 * Scenarios:
 *
 * 1. (0, 0, 0) to (2, 4, −6) at ¼ is (0.5, 1, −1.5); t = 0 and 1 are the ends.
 * 2. Opposite maximum finite X coordinates give a finite zero midpoint. Their
 *    endpoints, other coordinates and ordinary rounding stay intact.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the vector's quarter sample, two endpoints and the finite midpoint across opposite extremes.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `blendVec` at zero, quarter, midpoint and full progress. Compares all coordinates at extreme finite endpoints and requires exact equality for an ordinary last-bit-sensitive blend.
 * @evidence contracts/development/testing.md#independent-expectations The quarter from the origin to (2, 4, -6) is (0.5, 1, -1.5). Equal signed extreme weights cancel to zero while ordinary Y and Z average to 3. The direct ordinary formula gives X=0 in the separate rounding control.
 */
export function test_engine_resolve_blend_vec(): void {
  const a: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const b: IAutoMovieVector3 = { x: 2, y: 4, z: -6 };
  TestValidator.predicate(
    "a quarter",
    vclose(AutoMovieEngineResolve.blendVec(a, b, 0.25), {
      x: 0.5,
      y: 1,
      z: -1.5,
    }),
  );
  TestValidator.predicate(
    "the ends",
    vclose(AutoMovieEngineResolve.blendVec(a, b, 0), a) &&
      vclose(AutoMovieEngineResolve.blendVec(a, b, 1), b),
  );
  const first: IAutoMovieVector3 = {
    x: -Number.MAX_VALUE,
    y: 2,
    z: 9,
  };
  const last: IAutoMovieVector3 = {
    x: Number.MAX_VALUE,
    y: 4,
    z: -3,
  };
  TestValidator.equals(
    "opposite extremes keep a finite midpoint and ends",
    {
      start: AutoMovieEngineResolve.blendVec(first, last, 0),
      middle: AutoMovieEngineResolve.blendVec(first, last, 0.5),
      end: AutoMovieEngineResolve.blendVec(first, last, 1),
    },
    {
      start: first,
      middle: { x: 0, y: 3, z: 3 },
      end: last,
    },
  );
  TestValidator.predicate(
    "ordinary arithmetic retains its last-bit rounding",
    Object.is(
      AutoMovieEngineResolve.blendVec(
        { x: 1e16, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        1,
      ).x,
      0,
    ),
  );
}
