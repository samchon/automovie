import { realizeAutoMovieConstruction } from "@automovie/engine";
import type {
  IAutoMovieConstructionRealization,
  IAutoMovieConstructionView,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionChecks } from "../../../internal/construction/ConstructionChecks";
import { ConstructionShapes } from "../../../internal/construction/ConstructionShapes";

type V3 = [number, number, number];

/**
 * A view part closed at both ends realizes a closed G2 dome at each pole.
 *
 * Fixture: an ellipsoid of half axes a = 0.03, b = 0.02 and c = 0.05 m from 17
 * stations. Bound: the outline's natural cubic spline in the pole parameter
 * sigma = acos(-s / c), where the outline is a sin(sigma) with exact natural
 * ends (`ConstructionChecks.poleSpline`), plus the periodic cubic section's
 * error (`polarSpline`), plus 1e-9 of c.
 *
 * Scenarios:
 *
 * 1. No diagnostic; every skin vertex stands from the closed-form ellipsoid x^2 /
 *    a^2 + y^2 / b^2 + s^2 / c^2 = 1 within the bound, and every directed edge
 *    of the skin has its reverse.
 * 2. The vertices pushed 1 mm outward read past the bound, and the skin with one
 *    triangle dropped has an open edge.
 */
export function test_unit_engine_geometry_construction_view_pole(): void {
  const frame: ConstructionShapes.IFrame = ConstructionShapes.DOWN;
  const [a, b, c]: [number, number, number] = [0.03, 0.02, 0.05];
  const egg: IAutoMovieConstructionView = ConstructionShapes.ellipsoid(
    "egg",
    frame,
    a,
    b,
    c,
  );
  const real: IAutoMovieConstructionRealization.IRealization =
    realizeAutoMovieConstruction({ name: "made", root: egg }, { chord: 1e-4 });
  const positions: readonly number[] = real.mesh.positions;
  const points: V3[] = Array.from(
    { length: positions.length / 3 },
    (_: unknown, v: number): V3 => [
      positions[3 * v]!,
      positions[3 * v + 1]!,
      positions[3 * v + 2]!,
    ],
  );
  const bound: number =
    ConstructionChecks.poleSpline(Math.max(a, b), c, egg.stations) +
    ConstructionChecks.polarSpline(a, b, egg.order) +
    1e-9 * c;
  // Directed edges of a triangle list without their reverse.
  const open = (indices: readonly number[]): number => {
    const edges: Set<string> = new Set();
    for (let t: number = 0; t + 2 < indices.length; t += 3)
      for (let k: number = 0; k < 3; k++)
        edges.add(`${indices[t + k]},${indices[t + ((k + 1) % 3)]}`);
    return [...edges].filter((e: string): boolean => {
      const [p, q]: string[] = e.split(",");
      return !edges.has(`${q},${p}`);
    }).length;
  };

  // 1.
  TestValidator.equals("diagnostics", real.diagnostics, []);
  const off: number = ConstructionChecks.ellipsoid(points, frame, a, b, c);
  TestValidator.predicate(`on the ellipsoid: ${off} <= ${bound}`, off <= bound);
  TestValidator.equals("closed skin", open(real.mesh.indices), 0);

  // 2.
  const pushed: V3[] = points.map((p: V3): V3 => {
    const l: number = Math.hypot(...p);
    return l > 0
      ? [p[0] * (1 + 0.001 / l), p[1] * (1 + 0.001 / l), p[2] * (1 + 0.001 / l)]
      : p;
  });
  TestValidator.predicate(
    "pushed vertices leave the bound",
    ConstructionChecks.ellipsoid(pushed, frame, a, b, c) > bound,
  );
  TestValidator.predicate(
    "a dropped triangle opens the skin",
    open(real.mesh.indices.slice(3)) !== 0,
  );
}
