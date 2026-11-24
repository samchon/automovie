import { AutoMovieCubicOval64 } from "@automovie/engine";
import type { IAutoMovieCubicOval64 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

import { nclose } from "../internal/predicates";

/**
 * Homogeneous oval sizing keeps representable extreme-aspect diameters
 * positive.
 *
 * Scenarios:
 *
 * 1. The largest finite breadth/depth ratio produces two positive finite
 *    diameters, with the dominant diameter near half the girth.
 * 2. Reciprocal finite aspects exchange the diameters and doubling girth doubles
 *    both.
 * 3. A smallest-positive girth whose diameters underflow is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls axesBySimpson on extreme and ordinary scales, rejecting the former zero-diameter overflow result while preserving aspect symmetry and scaling.
 * @evidence contracts/development/testing.md#independent-expectations A collapsed convex oval has perimeter twice its dominant diameter; the 1e-3 relative bound allows quadrature error at the extreme. Exchange symmetry and homogeneity follow the same geometric curve family, without a second production oracle.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers largest-finite aspect, reciprocal ordinary aspects, scale doubling and unrepresentable tiny positive output. Existing curve tests own detailed perimeter approximation accuracy.
 * @evidence contracts/development/testing.md#execution-ownership This portable arithmetic entry invokes sizing functions with scalar inputs and owns all assertions.
 * @evidence contracts/development/common.md#meaningful-documentation States the representability, symmetry and positive-underflow cases and the geometric bound.
 */
export function test_geometry_cubic_oval_scale(): void {
  const extreme: IAutoMovieCubicOval64.IAxesBySimpsonResult =
    AutoMovieCubicOval64.axesBySimpson(100, Number.MAX_VALUE);
  TestValidator.predicate(
    "extreme aspect retains representable positive diameters",
    extreme.depthMm > 0 && Math.abs(extreme.breadthMm / 50 - 1) < 1e-3,
  );
  const wide: IAutoMovieCubicOval64.IAxesBySimpsonResult =
    AutoMovieCubicOval64.axesBySimpson(100, 4);
  const tall: IAutoMovieCubicOval64.IAxesBySimpsonResult =
    AutoMovieCubicOval64.axesBySimpson(100, 0.25);
  const large: IAutoMovieCubicOval64.IAxesBySimpsonResult =
    AutoMovieCubicOval64.axesBySimpson(200, 4);
  TestValidator.predicate(
    "reciprocal aspects exchange dimensions and scaling is homogeneous",
    nclose(wide.breadthMm, tall.depthMm) &&
      nclose(wide.depthMm, tall.breadthMm) &&
      nclose(large.breadthMm, 2 * wide.breadthMm) &&
      nclose(large.depthMm, 2 * wide.depthMm),
  );
  assert.throws((): void => {
    AutoMovieCubicOval64.axesBySimpson(Number.MIN_VALUE);
  }, RangeError);
}
