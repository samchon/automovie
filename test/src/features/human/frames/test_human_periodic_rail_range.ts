import { AutoMovieEngineNaturalSpline } from "@automovie/engine";
import { AutoMovieHumanPeriodicRailRange } from "@automovie/human";

import { nclose } from "../../internal/predicates";

/**
 * A periodic cubic's owned range includes its values between controls.
 *
 * Scenarios:
 * 1. Controls[1,1,2,2] have flat-span midpoints13/16 and35/16, both outside their control extrema; the source-domain bound must contain both.
 * 2. Constant controls stay exactly constant, and malformed/nonfinite periodic inputs are refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the actual native rail-range owner and the existing periodic reader; a control-only bound fails while a conservative whole-source bound is allowed.
 * @evidence contracts/development/testing.md#independent-expectations Solving the four cyclic cubic equations gives the literal13/16 and35/16 midpoint values; their containment is independent of the bound implementation.
 * @evidence contracts/development/testing.md#distinguishing-cases Includes undershoot, overshoot, the unchanged constant counterpart and missing/nonfinite controls.
 * @evidence contracts/development/testing.md#execution-ownership Made four-control scalar source and synchronous pure range admission only, with no person, loft, mesh or process.
 * @evidence contracts/development/common.md#meaningful-documentation Names conservative source-range scope and two scenarios.
 */
export function test_human_periodic_rail_range(): void {
  const failures: string[] = [];
  const controls: readonly number[] = [1, 1, 2, 2];
  const read = AutoMovieEngineNaturalSpline.periodic(controls);
  const bounds = AutoMovieHumanPeriodicRailRange.of(controls);
  for (const [phase, expected] of [
    [Math.PI / 4, 13 / 16],
    [(5 * Math.PI) / 4, 35 / 16],
  ]) {
    if (!nclose(read(phase!), expected!, 1e-12))
      failures.push("the independent periodic fixture differs");
    if (!(bounds[0] <= expected! && bounds[1] >= expected!))
      failures.push(
        "actual periodic midpoint " +
          expected +
          " leaves [" +
          bounds.join(",") +
          "]",
      );
  }
  const constant = AutoMovieHumanPeriodicRailRange.of([2, 2, 2]);
  if (!nclose(constant[0], 2, 1e-12) || !nclose(constant[1], 2, 1e-12))
    failures.push("constant rail acquired a width");
  for (const bad of [[], [1, 2], [1, NaN, 2]]) {
    let refused = false;
    try {
      AutoMovieHumanPeriodicRailRange.of(bad);
    } catch {
      refused = true;
    }
    if (!refused) failures.push("invalid periodic controls accepted");
  }
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
