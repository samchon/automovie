import {
  type AutoMovieConstructionRealization,
  type IAutoMovieSolidSurface,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import type { IAutoMovieConstructionView } from "@automovie/interface";

import { ConstructionChecks } from "../../internal/construction/ConstructionChecks";
import { ConstructionRead } from "../../internal/construction/ConstructionRead";
import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

/**
 * A view part realizes as a section chain that touches its outline box at
 * every knot station on the four guides with zero angular slope, at any
 * size, with no diagnostic.
 *
 * Scenarios:
 * 1. A cylinder of radius 0.02 m and length 0.1 m, and an ellipsoid of half axes 0.03, 0.02 and 0.05 m: at every knot station the realized surface's points at the guide phases stand on the box sides within 1e-9 of the part's size, square to their guides, and the realization records no diagnostic.
 * 2. The same parts a thousand times larger read the same, scaled.
 * 3. Red: the ellipsoid's surface turned 20 degrees about its axis, read through the same check, misses its box sides.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Realizes each part alone with `realizeAutoMovieConstruction` and reads its surface at every knot station on the four guide phases through `ConstructionChecks.touch`. It catches a section whose extreme slid off its guide, a box side missed by the section, a guide with an angular slope, and a tolerance that holds at one size and not another; any construction that touches each box side at its guide passes.
 * @evidence contracts/development/testing.md#independent-expectations The view part's contract (`IAutoMovieConstructionView`): the section touches each side of its box once, at the polar angles 0, `pi / 2`, `pi` and `3 pi / 2`, with zero angular slope, the box the outlines' values at the station; each guide is a knot of the section's B-spline (`order` a multiple of 4), so the touch is exact to rounding, 1e-9 of the part's size. The closed forms: a cylinder's constant radius, an ellipsoid's `a sqrt(1 - s^2 / c^2)`. Oracle limit: the poles' stations have no box and are read by `test_construction_view_pole`.
 * @evidence contracts/development/testing.md#distinguishing-cases Positive: a cylinder and an ellipsoid at two sizes a thousand times apart. Negative: the turned surface. The girth's fullness belongs to `test_construction_view_girth`, the pole to `test_construction_view_pole`, broken boxes to `test_construction_diagnostics`.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_view_touch`; it realizes made trees in process and starts no host, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A cylinder of radius 0.02 m and length 0.1 m, and an ellipsoid of half axes 0.03, 0.02 and 0.05 m: at every knot station the realized...).
 */
export function test_construction_view_touch(): void {
  const failures: string[] = [];
  const frame: ConstructionShapes.IFrame = ConstructionShapes.DOWN;
  for (const k of [1, 1000]) {
    const cylinder: IAutoMovieConstructionView = ConstructionShapes.cylinder(
      "tube",
      frame,
      0.02 * k,
      0.1 * k,
    );
    const ellipsoid: IAutoMovieConstructionView = ConstructionShapes.ellipsoid(
      "egg",
      frame,
      0.03 * k,
      0.02 * k,
      0.05 * k,
    );
    const parts: [
      IAutoMovieConstructionView,
      (s: number) => [number, number, number, number],
    ][] = [
      [
        cylinder,
        (): [number, number, number, number] => [
          0.02 * k,
          0.02 * k,
          0.02 * k,
          0.02 * k,
        ],
      ],
      [
        ellipsoid,
        (s: number): [number, number, number, number] => {
          const q: number = Math.sqrt(Math.max(0, 1 - (s / (0.05 * k)) ** 2));
          return [0.03 * k * q, 0.02 * k * q, 0.03 * k * q, 0.02 * k * q];
        },
      ],
    ];
    for (const [part, half] of parts) {
      const r: AutoMovieConstructionRealization.IRealization =
        realizeAutoMovieConstruction(
          { name: "made", root: part },
          { chord: 1e-4 * k },
        );
      if (r.diagnostics.length !== 0)
        failures.push(
          `${part.name} at ${k}: diagnostics ${ConstructionRead.diagnostics(r)}`,
        );
      // The kernel's surfaces are in millimetres; the fixture's closed forms in metres.
      const surface: IAutoMovieSolidSurface = ConstructionRead.metres(
        ConstructionRead.surface(r, part.name),
      );
      failures.push(
        ...ConstructionChecks.touch(
          surface,
          frame,
          part.stations,
          half,
          1e-9 * 0.05 * k,
        ).map((f: string): string => `at ${k}: ${f}`),
      );

      // Red: the same surface read 20 degrees round its axis.
      const turned: IAutoMovieSolidSurface = {
        ...surface,
        jet: (u: number, v: number): IAutoMovieSolidSurface.IJet =>
          surface.jet(u, v + (20 * Math.PI) / 180),
      };
      if (
        part.name === "egg" &&
        ConstructionChecks.touch(
          turned,
          frame,
          part.stations,
          half,
          1e-9 * 0.05 * k,
        ).length === 0
      )
        failures.push(`proof at ${k}: the turned ellipsoid touches its box`);
    }
  }
  if (failures.length !== 0)
    throw new Error(
      `${failures.length} view touch failures:\n${failures.join("\n")}`,
    );
}
