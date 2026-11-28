import { AutoMovieEngineSweep } from "@automovie/engine";
import type {
  AutoMovieSurfaceTier,
  IAutoMovieSurfaceNetwork,
  IAutoMovieSweepSurface,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { sweepGirthTube } from "../../internal/sweepGirthTube";
import { sweepRowPerimeter } from "../../internal/sweepRowPerimeter";

/**
 * A ring that declares a perimeter holds the subdivided limit surface's
 * perimeter along it, to 0.5 mm, at 8, 12 and 16 columns (lowest, low and
 * medium tiers).
 *
 * Tube: swelling to its middle; the perimeter of a section is measured by the
 * 4096-segment polyline of the compiled sweep.
 *
 * Scenarios:
 *
 * 1. An elliptic section (exponent 2) with its middle ring declaring the sweep's
 *    own perimeter holds it at all three tiers.
 * 2. A rounded-rectangle section (exponent 4) does the same.
 * 3. Rings at u 0.375, 0.5 and 0.625 declaring 3 percent more, the same and 2
 *    percent less than the sweep's own perimeters, a row apart at the medium
 *    tier, all hold together.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the subdivided perimeter tolerance, three sampling tiers and simultaneous different requested lengths.
 * @evidence contracts/development/testing.md#behavioral-verification Compiles real elliptic and rounded-rectangle sections and measures the resulting subdivided limit rings against authored targets across tiers.
 * @evidence contracts/development/testing.md#independent-expectations A dense 4096-edge polyline supplies independent source perimeter. The declared percentages alter it by known factors, and the 0.5 mm bound tests each ring separately.
 */
export function test_engine_geometry_sweep_girth(): void {
  const held: number = 0.0005;
  const section = (sweep: IAutoMovieSweepSurface, u: number): number => {
    let length: number = 0;
    for (let k: number = 0; k < 4096; ++k) {
      const a: IAutoMovieVector3 = sweep.point(u, k / 4096);
      const b: IAutoMovieVector3 = sweep.point(u, (k + 1) / 4096);
      length += Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
    }
    return length;
  };
  const tiers: AutoMovieSurfaceTier[] = ["lowest", "low", "medium"];
  for (const exponent of [2, 4]) {
    const sweep: IAutoMovieSweepSurface = AutoMovieEngineSweep.compileSweep(
      sweepGirthTube({ exponent }).sweeps.tube!,
    );
    const perimeter: number = section(sweep, 0.5);
    for (const tier of tiers)
      TestValidator.predicate(
        `exponent ${exponent} ${tier}`,
        Math.abs(
          sweepRowPerimeter(
            sweepGirthTube({ exponent, perimeter }),
            tier,
            [0.5],
          )[0]! - perimeter,
        ) <= held,
      );
  }
  const sweep: IAutoMovieSweepSurface = AutoMovieEngineSweep.compileSweep(
    sweepGirthTube({ exponent: 2 }).sweeps.tube!,
  );
  const declared: [number, number][] = [
    [0.375, 1.03 * section(sweep, 0.375)],
    [0.5, section(sweep, 0.5)],
    [0.625, 0.98 * section(sweep, 0.625)],
  ];
  const network: IAutoMovieSurfaceNetwork = sweepGirthTube({
    exponent: 2,
    perimeter: declared[1]![1],
    beside: [declared[0]![1], declared[2]![1]],
  });
  const measured: number[] = sweepRowPerimeter(
    network,
    "medium",
    declared.map(([u]: [number, number]): number => u),
  );
  declared.forEach(([, perimeter]: [number, number], k: number): void => {
    TestValidator.predicate(
      `coupled ${k}`,
      Math.abs(measured[k]! - perimeter) <= held,
    );
  });
}
