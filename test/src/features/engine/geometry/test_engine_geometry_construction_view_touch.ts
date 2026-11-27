
import { AutoMovieEngineConstruction } from "@automovie/engine";
import type {
  IAutoMovieConstructionRealization,
  IAutoMovieConstructionView,
  IAutoMovieSolidSurface,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionChecks } from "../../internal/construction/ConstructionChecks";
import { ConstructionRead } from "../../internal/construction/ConstructionRead";
import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

/**
 * A view part's section touches its outline box at every knot station on the
 * four guides (polar angles 0, pi / 2, pi and 3 pi / 2) with zero angular
 * slope. Each guide is a knot of the section's B-spline, so the touch is exact
 * to rounding: 1e-9 of the part's size.
 *
 * Fixtures: a cylinder of radius 0.02 and length 0.1, half extents constant,
 * and an ellipsoid of half axes a = 0.03, b = 0.02 and c = 0.05, half extents a
 * q and b q with q = sqrt(1 - s^2 / c^2), in metres times k = 1 and 1000,
 * realized without their skins.
 *
 * Scenarios:
 *
 * 1. No diagnostic, and every knot station's guide points stand on the box sides
 *    square to their guides (`ConstructionChecks.touch`), at both sizes.
 * 2. The ellipsoid's surface read 20 degrees round its axis misses its box.
 */
export function test_engine_geometry_construction_view_touch(): void {
  const frame: ConstructionShapes.IFrame = ConstructionShapes.DOWN;
  for (const k of [1, 1000]) {
    const parts: [
      IAutoMovieConstructionView,
      (s: number) => [number, number, number, number],
    ][] = [
      [
        ConstructionShapes.cylinder("tube", frame, 0.02 * k, 0.1 * k),
        (): [number, number, number, number] => [
          0.02 * k,
          0.02 * k,
          0.02 * k,
          0.02 * k,
        ],
      ],
      [
        ConstructionShapes.ellipsoid(
          "egg",
          frame,
          0.03 * k,
          0.02 * k,
          0.05 * k,
        ),
        (s: number): [number, number, number, number] => {
          const q: number = Math.sqrt(Math.max(0, 1 - (s / (0.05 * k)) ** 2));
          return [0.03 * k * q, 0.02 * k * q, 0.03 * k * q, 0.02 * k * q];
        },
      ],
    ];
    for (const [part, half] of parts) {
      const label: string = `${part.name} at ${k}`;
      const real: IAutoMovieConstructionRealization.IWithoutSkin =
        AutoMovieEngineConstruction.realize(
          { name: "made", root: part },
          { chord: 1e-4 * k, skin: false },
        );
      TestValidator.equals(`${label} diagnostics`, real.diagnostics, []);
      const surface: IAutoMovieSolidSurface = ConstructionRead.metres(
        ConstructionRead.surface(real, part.name),
      );
      const touch = (s: IAutoMovieSolidSurface): string[] =>
        ConstructionChecks.touch(
          s,
          frame,
          part.stations,
          half,
          1e-9 * 0.05 * k,
        );

      // 1.
      TestValidator.equals(`${label} touch`, touch(surface), []);

      // 2.
      if (part.name === "egg")
        TestValidator.predicate(
          `${label} turned misses`,
          touch({
            ...surface,
            jet: (u: number, v: number): IAutoMovieSolidSurface.IJet =>
              surface.jet(u, v + (20 * Math.PI) / 180),
          }).length !== 0,
        );
    }
  }
}
