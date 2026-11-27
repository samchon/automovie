import type {
  IAutoMovieConstructionNode,
  IAutoMovieConstructionRealization,
  IAutoMovieSolidSurface,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionRead } from "../../internal/construction/ConstructionRead";
import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";
import { ConstructionSplitFan as F } from "../../internal/construction/ConstructionSplitFan";

/**
 * A profile's `square` makes the outer bands leave the host's ring square to
 * it.
 *
 * Fixture: `ConstructionSplitFan` (a host circle of radius R = 25 sqrt(1 - (30
 * / 80)^2) mm at z = -30, seam 0 the chord x = +8 mm, seam 1 the chord x = -8
 * mm enclosing it, three fingers of radius 7 mm, 32 columns, 4 rows).
 *
 * Host here: an elliptic section of half extents r and 0.6 r shrinking along
 * its course, whose station lines lean along its ring.
 *
 * Scenarios:
 *
 * 1. Without `square`, the outer bands' arc columns 3 to 21 (at least 0.59 rad of
 *    clock from either fork, outside the corner turn's 0.3) leave the loop
 *    leaning along it: the cosine of a column's start direction with the host
 *    ring's tangent exceeds 0.02 somewhere (0.046).
 * 2. With `square`, every such column leaves square to the ring (cosine at most
 *    1e-6).
 */
export function test_engine_geometry_split_fan_square(): void {
  const n: number = F.COLUMNS;
  const t: number = F.T;
  const oval: IAutoMovieConstructionNode = ConstructionShapes.part(
    "trunk",
    ConstructionShapes.DOWN,
    ConstructionShapes.uniform(-0.06, 0.03, 13),
    (s: number): [number, number, number, number] => {
      const r: number = 0.025 * Math.sqrt(1 - (s / 0.08) ** 2);
      return [r, 0.6 * r, r, 0.6 * r];
    },
    "open",
  );
  const lean = (square: boolean): number => {
    const made: IAutoMovieConstructionRealization.IRealization = F.realize(
      F.split({
        outer: F.OUTER,
        host: oval,
        profile: {
          knots: [{ alongM: 0.002, depthM: 0.002 }],
          corner: 0.3,
          ...(square ? { square } : {}),
        },
      }),
    );
    TestValidator.equals(`diagnostics ${square}`, made.diagnostics.length, 0);
    let most: number = 0;
    const trunk: IAutoMovieSolidSurface = ConstructionRead.surface(
      made,
      "trunk",
    );
    const arcs: [string, number][] = [
      ["band.f.0", -t],
      ["band.f.2", Math.PI - t],
    ];
    for (const [name, from] of arcs) {
      const band: IAutoMovieSolidSurface = ConstructionRead.surface(made, name);
      for (let k: number = 3; k <= 21; ++k) {
        const u: readonly number[] = band.jet(0, (F.TURN * k) / n).u;
        const v: readonly number[] = trunk.jet(30, from + (2 * t * k) / 24).v;
        const cosine: number =
          (u[0]! * v[0]! + u[1]! * v[1]! + u[2]! * v[2]!) /
          (Math.hypot(u[0]!, u[1]!, u[2]!) * Math.hypot(v[0]!, v[1]!, v[2]!));
        most = Math.max(most, Math.abs(cosine));
      }
    }
    return most;
  };
  TestValidator.predicate("leans without square", lean(false) > 0.02);
  TestValidator.predicate("square with square", lean(true) <= 1e-6);
}
