import type { IAutoMovieSolidSurface } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionRead } from "../../internal/construction/ConstructionRead";
import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";
import { ConstructionSplitFan as F } from "../../internal/construction/ConstructionSplitFan";

/**
 * A fan split's curved seam follows its heading, and correspondence by length
 * starts where the loop and the rail stand closest.
 *
 * Fixture: `ConstructionSplitFan` (a host circle of radius R = 25 sqrt(1 - (30
 * / 80)^2) mm at z = -30, seam 0 the chord x = +8 mm, seam 1 the chord x = -8
 * mm enclosing it, three fingers of radius 7 mm, 32 columns, 4 rows).
 *
 * Scenarios:
 *
 * 1. Every child matched by arclength share realizes with no diagnostic.
 * 2. Seam 0 curved with one knot 4 mm deep at its middle and the heading (0.6, 0,
 *    -0.8) stands in the plane through its chord that holds the heading (normal
 *    (-0.8, 0, -0.6)), its points within 1e-6 mm of it, and leaves the plane x
 *    = 8 mm that the end normal alone would give by more than 1 mm.
 * 3. With child `f.0` hung 4 mm aside (y = 0.004), its band's loop and rail
 *    points, each about its own centroid and read in the rail's plane, turn by
 *    less than 3 degrees on average.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names arclength correspondence, the headed seam plane and the displaced child turning check.
 * @evidence contracts/development/testing.md#behavioral-verification Realizes the fan with headed and displaced configurations, then measures seam positions and the loop-to-rail turn.
 * @evidence contracts/development/testing.md#independent-expectations The prescribed heading and chord determine normal (−0.8,0,−0.6). Points leave the simpler x = 8 plane, and the selected closest arclength match limits average twist.
 */
export function test_engine_geometry_split_fan_heading(): void {
  const n: number = F.COLUMNS;
  const lengthwise = F.realize(
    F.split({ outer: F.OUTER, children: F.three("length") }),
  );
  TestValidator.equals(
    "length correspondence diagnostics",
    lengthwise.diagnostics.length,
    0,
  );

  const headed = F.realize(
    F.split({
      outer: F.OUTER,
      children: F.three("length"),
      profile: F.headed(),
    }),
  );
  TestValidator.equals("heading diagnostics", headed.diagnostics.length, 0);
  const band: IAutoMovieSolidSurface = ConstructionRead.surface(
    headed,
    "band.f.0",
  );
  let off: number = 0;
  let lean: number = 0;
  for (let k: number = (3 * n) / 4 + 1; k < n; ++k) {
    const p: readonly number[] = band.jet(0, (F.TURN * k) / n).p;
    off = Math.max(off, Math.abs(-0.8 * (p[0]! - 8) - 0.6 * (p[2]! + 30)));
    lean = Math.max(lean, p[0]! - 8);
  }
  TestValidator.predicate("seam stands in its plane", off <= 1e-6);
  TestValidator.predicate("seam leaves the chord's plane", lean > 1);

  const aside = F.realize(
    F.split({
      outer: F.OUTER,
      children: [
        {
          ...F.child("f.0", 0.0165),
          part: ConstructionShapes.part(
            "f.0",
            {
              ...ConstructionShapes.DOWN,
              origin: { x: 0.0165, y: 0.004, z: -0.03 },
            },
            ConstructionShapes.uniform(0, 0.06, 7),
            (): [number, number, number, number] => [
              0.007, 0.007, 0.007, 0.007,
            ],
            "open",
          ),
          correspondence: "length",
        },
        F.child("f.1", 0),
        F.child("f.2", -0.0165),
      ],
    }),
  );
  TestValidator.equals("aside diagnostics", aside.diagnostics.length, 0);
  const moved: IAutoMovieSolidSurface = ConstructionRead.surface(
    aside,
    "band.f.0",
  );
  const length: number = moved.domain![1];
  const loop: number[][] = Array.from(
    { length: n },
    (_: unknown, k: number): number[] => [...moved.jet(0, (F.TURN * k) / n).p],
  );
  const rail: number[][] = Array.from(
    { length: n },
    (_: unknown, k: number): number[] => [
      ...moved.jet(length, (F.TURN * k) / n).p,
    ],
  );
  const centre = (q: number[][]): number[] =>
    [0, 1, 2].map(
      (a: number): number =>
        q.reduce((s: number, p: number[]): number => s + p[a]!, 0) / q.length,
    );
  const cl: number[] = centre(loop);
  const cr: number[] = centre(rail);
  let sum: number = 0;
  for (let k: number = 0; k < n; ++k) {
    const ux: number = loop[k]![0]! - cl[0]!;
    const uy: number = loop[k]![1]! - cl[1]!;
    const vx: number = rail[k]![0]! - cr[0]!;
    const vy: number = rail[k]![1]! - cr[1]!;
    sum += (Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy) * 180) / Math.PI;
  }
  TestValidator.predicate(
    "average turn under 3 degrees",
    Math.abs(sum / n) < 3,
  );
}
