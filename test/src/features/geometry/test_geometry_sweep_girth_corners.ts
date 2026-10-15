import {
  type IAutoMovieSweepSurface,
  compileAutoMovieSweep,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { sweepGirthTube } from "../internal/sweepGirthTube";
import { sweepRowPerimeter } from "../internal/sweepRowPerimeter";

/** Metres the held limit perimeter may differ from the declared one. */
const HELD: number = 0.0005;

/**
 * A ring that declares a perimeter holds the limit surface's perimeter along
 * it on a rounded rectangle at 8, 12 and 16 columns.
 *
 * Scenarios:
 *
 * 1. The tube swelling to its middle, with a rounded-rectangle section, its middle
 *    ring declaring the sweep's own perimeter there: at the lowest, low and
 *    medium tiers, 8, 12 and 16 columns, the subdivided limit's perimeter
 *    along the ring lies within 0.5 mm of it.
 *
 * @evidence contracts/testing.md#behavioral-verification Samples the girth network with `sampleAutoMovieSurfaceNetwork` and measures the subdivided limit along the ring; a factor solved on the wrong row, a wrong measurement of the isoline or a factor lost before the rest fit leaves the perimeter millimetres short, while any hold that meets the declaration passes.
 * @evidence contracts/testing.md#independent-expectations The declared perimeter is the sweep's own section at the ring, a dense polyline of `compileAutoMovieSweep`; the measured one is a Richardson-extrapolated polyline through subdivided limit positions, independent of the engine's quadrature.
 * @evidence contracts/testing.md#distinguishing-cases Covers three column counts and a ring at a girth maximum, where sampling loses the most; the smooth section is owned by the girth test, coupled rings by the coupled girth test, and the free shortfall and the refusals by the girth refusal test.
 * @evidence contracts/testing.md#execution-ownership A portable unit test reached through the discoverable `test_geometry_sweep_girth_corners` entry with no process, browser or GPU.
 */
export function test_geometry_sweep_girth_corners(): void {
  const sweep: IAutoMovieSweepSurface = compileAutoMovieSweep(
    sweepGirthTube({ exponent: 4 }).sweeps.tube!,
  );
  let perimeter: number = 0;
  for (let k: number = 0; k < 4096; ++k) {
    const a = sweep.point(0.5, k / 4096);
    const b = sweep.point(0.5, (k + 1) / 4096);
    perimeter += Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
  }
  TestValidator.equals(
    "the rounded rectangle's held girth matches at 8, 12 and 16 columns",
    (["lowest", "low", "medium"] as const).map(
      (tier): boolean =>
        Math.abs(
          sweepRowPerimeter(
            sweepGirthTube({ exponent: 4, perimeter }),
            tier,
            [0.5],
          )[0]! - perimeter,
        ) <= HELD,
    ),
    [true, true, true],
  );
}
