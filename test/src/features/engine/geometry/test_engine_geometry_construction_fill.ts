
import { AutoMovieEngineConstruction } from "@automovie/engine";
import type {
  IAutoMovieConstructionFill,
  IAutoMovieConstructionRealization,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

/**
 * A construction's fills fair the drawn skin about their datum points.
 *
 * Construction: the merged assembly (left grouping) at chord 1e-4; the datum is
 * one of its own skin vertices (the middle one); fill radius 5 mm.
 *
 * Scenarios:
 *
 * 1. A fill at that skin vertex records no diagnostic, keeps every index, moves at
 *    least one vertex, and moves only vertices within three radii of the
 *    point.
 * 2. A fill whose point stands 0.1 m off the skin records exactly one diagnostic
 *    of contract `fill` and leaves the skin as the plain assembly's.
 */
export function test_engine_geometry_construction_fill(): void {
  const realize = (
    fills: IAutoMovieConstructionFill[],
  ): IAutoMovieConstructionRealization.IRealization =>
    AutoMovieEngineConstruction.realize(
      {
        name: "made.fill",
        root: ConstructionShapes.assembly(1, "left"),
        fills,
      },
      { chord: 1e-4 },
    );
  const plain: IAutoMovieConstructionRealization.IRealization = realize([]);
  const p: number[] = plain.mesh.positions;
  const v: number = Math.floor(p.length / 6);
  const point: [number, number, number] = [
    p[3 * v]!,
    p[3 * v + 1]!,
    p[3 * v + 2]!,
  ];
  const radius: number = 0.005;

  const filled: IAutoMovieConstructionRealization.IRealization = realize([
    { point, radius },
  ]);
  TestValidator.equals("on-skin diagnostics", filled.diagnostics.length, 0);
  TestValidator.equals("indices", filled.mesh.indices, plain.mesh.indices);
  let moved: number = 0;
  for (let k: number = 0; 3 * k < p.length; k++) {
    const d: number = Math.hypot(
      filled.mesh.positions[3 * k]! - p[3 * k]!,
      filled.mesh.positions[3 * k + 1]! - p[3 * k + 1]!,
      filled.mesh.positions[3 * k + 2]! - p[3 * k + 2]!,
    );
    if (!(d > 0)) continue;
    ++moved;
    const far: number = Math.hypot(
      p[3 * k]! - point[0],
      p[3 * k + 1]! - point[1],
      p[3 * k + 2]! - point[2],
    );
    TestValidator.predicate(
      `vertex ${k} within three radii`,
      far <= 3 * radius,
    );
  }
  TestValidator.predicate("some vertex moved", moved > 0);

  const off: IAutoMovieConstructionRealization.IRealization = realize([
    { point: [point[0] + 0.1, point[1], point[2]], radius },
  ]);
  TestValidator.equals("off-skin diagnostics", off.diagnostics.length, 1);
  TestValidator.equals(
    "off-skin contract",
    off.diagnostics[0]?.contract,
    "fill",
  );
  TestValidator.equals("skin unchanged", off.mesh.positions, p);
}
