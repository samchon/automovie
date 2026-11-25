import { realizeAutoMovieConstruction } from "@automovie/engine";
import type {
  IAutoMovieConstructionKnot,
  IAutoMovieConstructionRealization,
  IAutoMovieConstructionView,
  IAutoMovieSolidSurface,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionChecks } from "../../../internal/construction/ConstructionChecks";
import { ConstructionRead } from "../../../internal/construction/ConstructionRead";
import { ConstructionShapes } from "../../../internal/construction/ConstructionShapes";

type P2 = [number, number];

/**
 * A view part whose fullness is its tape girth (`IAutoMovieConstructionGirth`)
 * realizes sections whose taut tape is that girth; one girth gives one
 * shoulder, so the inscribed ellipse's perimeter gives the ellipse.
 *
 * Fixture: a straight part of half axes a = 0.03 and b = 0.02 m over five
 * stations, its girth the ellipse's AGM perimeter, realized without its skin.
 * The taut tape is the perimeter of the convex hull (Andrew's monotone chain)
 * of the section at 1024 phases, which under-reads by under 4e-6 of it; the
 * periodic cubic section errs by at most `ConstructionChecks.polarSpline`, the
 * bound, so the tape tolerance is 2 pi bound + 4e-6 perimeter.
 *
 * Scenarios:
 *
 * 1. No diagnostic; at every station the tape is the girth within its tolerance,
 *    and the section at 64 phases stands on the ellipse within the bound.
 * 2. The tape read against a girth three tolerances larger misses it.
 */
export function test_unit_engine_geometry_construction_view_girth(): void {
  const [a, b]: [number, number] = [0.03, 0.02];
  const frame: ConstructionShapes.IFrame = ConstructionShapes.DOWN;
  const base: IAutoMovieConstructionView = ConstructionShapes.part(
    "band",
    frame,
    ConstructionShapes.uniform(0, 0.08, 5),
    (): [number, number, number, number] => [a, b, a, b],
    "open",
  );
  const perimeter: number = ConstructionShapes.Oracle.perimeter(a, b);
  const part: IAutoMovieConstructionView = {
    ...base,
    fullness: {
      type: "girth",
      girth: {
        knots: base.stations.map(
          (station: number, i: number): IAutoMovieConstructionKnot => ({
            site: `girth ${i}`,
            station,
            value: perimeter,
          }),
        ),
      },
      departures: null,
    },
  };
  const real: IAutoMovieConstructionRealization.IWithoutSkin =
    realizeAutoMovieConstruction(
      { name: "made", root: part },
      { chord: 1e-4, skin: false },
    );
  const surface: IAutoMovieSolidSurface = ConstructionRead.metres(
    ConstructionRead.surface(real, "band"),
  );
  const bound: number = ConstructionChecks.polarSpline(a, b, part.order);
  const tolerance: number = 2 * Math.PI * bound + 4e-6 * perimeter;
  const ring = (s: number, n: number): P2[] =>
    Array.from(
      { length: n },
      (_: unknown, k: number): P2 =>
        ConstructionChecks.chart(
          frame,
          s,
          surface.jet(s, (2 * Math.PI * k) / n).p,
        ),
    );
  const hull = (points: P2[]): number => {
    const sorted: P2[] = [...points].sort(
      (u: P2, v: P2): number => u[0] - v[0] || u[1] - v[1],
    );
    const turn = (o: P2, p: P2, q: P2): number =>
      (p[0] - o[0]) * (q[1] - o[1]) - (p[1] - o[1]) * (q[0] - o[0]);
    const chain = (list: P2[]): P2[] => {
      const out: P2[] = [];
      for (const q of list) {
        while (out.length >= 2 && turn(out.at(-2)!, out.at(-1)!, q) <= 0)
          out.pop();
        out.push(q);
      }
      return out.slice(0, -1);
    };
    const loop: P2[] = [...chain(sorted), ...chain([...sorted].reverse())];
    return loop.reduce(
      (sum: number, p: P2, i: number): number =>
        sum +
        Math.hypot(
          loop[(i + 1) % loop.length]![0] - p[0],
          loop[(i + 1) % loop.length]![1] - p[1],
        ),
      0,
    );
  };

  // 1.
  TestValidator.equals("diagnostics", real.diagnostics, []);
  for (const s of part.stations) {
    TestValidator.predicate(
      `station ${s} tape`,
      Math.abs(hull(ring(s, 1024)) - perimeter) <= tolerance,
    );
    TestValidator.predicate(
      `station ${s} ellipse`,
      ring(s, 64).every(
        ([x, z]: P2): boolean =>
          Math.abs(Math.sqrt((x / a) ** 2 + (z / b) ** 2) - 1) * b <= bound,
      ),
    );
  }

  // 2.
  TestValidator.predicate(
    "a larger girth misses",
    Math.abs(
      hull(ring(part.stations[2]!, 1024)) - (perimeter + 3 * tolerance),
    ) > tolerance,
  );
}
