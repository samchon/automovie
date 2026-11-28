import { AutoMovieEngineGeometry } from "@automovie/engine";
import type { IAutoMovieBicubicAtlasGeometry as Atlas } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createBicubicPlaneRecipe } from "../../internal/createBicubicPlaneRecipe";

/**
 * `realizeBicubicAtlas64(atlas, { retainTriangleParameters })` keeps
 * each triangle corner's own chart parameters, through shared vertices and
 * local omissions.
 *
 * Fixture: the unit bicubic plane patch and a second affine square beside it
 * sharing its x = 1 control column.
 *
 * Scenarios:
 *
 * 1. Both charts complete, with one (u, v) pair per index corner, each in [0, 1]
 *    and equal to the corner's own position (x - patch offset, y); at least two
 *    render indices on the shared edge carry u = 1 from one chart and u = 0
 *    from the other.
 * 2. Without retention no parameters are published, and the indices, positions
 *    and normals are the same.
 * 3. A five-vertex budget stays partial with parameters for its kept triangles;
 *    no patches give an empty buffer; a collapsed patch omits its zero-area
 *    triangles and publishes no pairs.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names local versus shared index coordinates, optional retention, partial work and empty or collapsed patches.
 * @evidence contracts/development/testing.md#behavioral-verification Realizes adjacent affine patches with retention enabled and disabled, then compares buffers, per-corner coordinates, sharing and the incomplete cases.
 * @evidence contracts/development/testing.md#independent-expectations Each patch's affine map makes local u equal world x minus its offset. The shared edge therefore has u = 1 and u = 0 on opposite charts. An omitted triangle contributes zero corner pairs.
 */
export function test_engine_geometry_bicubic_atlas_parameters(): void {
  const recipe: Atlas = createBicubicPlaneRecipe();
  const second: number[] = [];
  for (let row: number = 0; row < 4; ++row)
    for (let column: number = 0; column < 4; ++column) {
      if (column === 0) second.push(4 * row + 3);
      else {
        second.push(recipe.controls.length);
        recipe.controls.push({ x: 1 + column / 3, y: row / 3, z: 0 });
      }
    }
  recipe.patches.push({ id: "second", controlIds: second });

  // 1.
  const output: ReturnType<typeof AutoMovieEngineGeometry.realizeBicubicAtlas64> = AutoMovieEngineGeometry.realizeBicubicAtlas64(recipe, { retainTriangleParameters: true });
  const uv: number[] = output.triangleParameters!;
  const ix: number[] = output.mesh.indices!;
  TestValidator.equals("complete", output.complete, true);
  TestValidator.equals("pairs", uv.length, ix.length * 2);
  const edge: Map<number, Set<number>> = new Map();
  for (const range of output.primitiveRanges)
    for (let t: number = range.firstTriangle; t < range.firstTriangle + range.triangleCount; ++t)
      for (let corner: number = 0; corner < 3; ++corner) {
        const at: number = 3 * t + corner;
        const index: number = ix[at]!;
        const [u, v] = [uv[2 * at]!, uv[2 * at + 1]!];
        const [x, y] = [output.mesh.positions[3 * index]!, output.mesh.positions[3 * index + 1]!];
        TestValidator.predicate(
          `chart ${at}`,
          u >= 0 &&
            u <= 1 &&
            v >= 0 &&
            v <= 1 &&
            Math.abs(x - (range.patch === "second" ? 1 : 0) - u) <= 1e-12 &&
            Math.abs(y - v) <= 1e-12,
        );
        if (Math.abs(x - 1) <= 1e-12) {
          const set: Set<number> = edge.get(index) ?? new Set();
          set.add(u);
          edge.set(index, set);
        }
      }
  TestValidator.predicate(
    "shared edge",
    [...edge.values()].filter((s: Set<number>): boolean => s.has(0) && s.has(1)).length >= 2,
  );

  // 2.
  const plain: ReturnType<typeof AutoMovieEngineGeometry.realizeBicubicAtlas64> = AutoMovieEngineGeometry.realizeBicubicAtlas64(recipe);
  TestValidator.equals("no parameters", plain.triangleParameters, undefined);
  TestValidator.equals(
    "same mesh",
    [plain.mesh.indices, plain.mesh.positions, plain.mesh.normals],
    [output.mesh.indices, output.mesh.positions, output.mesh.normals],
  );

  // 3.
  recipe.maxVertices = 5;
  const partial: ReturnType<typeof AutoMovieEngineGeometry.realizeBicubicAtlas64> = AutoMovieEngineGeometry.realizeBicubicAtlas64(recipe, { retainTriangleParameters: true });
  TestValidator.equals("partial", partial.complete, false);
  TestValidator.equals("partial pairs", partial.triangleParameters!.length, partial.mesh.indices!.length * 2);
  const empty: Atlas = { ...createBicubicPlaneRecipe(), patches: [] };
  TestValidator.equals("empty", AutoMovieEngineGeometry.realizeBicubicAtlas64(empty, { retainTriangleParameters: true }).triangleParameters!.length, 0);
  const plane: Atlas = createBicubicPlaneRecipe();
  const collapsed: ReturnType<typeof AutoMovieEngineGeometry.realizeBicubicAtlas64> = AutoMovieEngineGeometry.realizeBicubicAtlas64(
    { ...plane, controls: plane.controls.map(() => ({ x: 0, y: 0, z: 0 })) },
    { retainTriangleParameters: true },
  );
  TestValidator.predicate("omitted", collapsed.counts.omittedZeroAreaTriangles > 0);
  TestValidator.equals("no pairs", collapsed.triangleParameters!.length, 0);
}
