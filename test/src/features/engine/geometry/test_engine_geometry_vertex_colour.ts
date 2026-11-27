import { AutoMovieEngineGeometry } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { vertexColourMesh } from "../../internal/vertexColourFixture";

/**
 * Vertex colour follows vertex correspondence, not world coordinates, through
 * `transformMesh`, `mergeMeshes` and a deformer
 * (`createMeshDeformer`).
 *
 * Fixture: the three-vertex coloured triangle (`vertexColourMesh`) and the same
 * mesh without colours.
 *
 * Scenarios:
 *
 * 1. A mirroring placement (scale (-2, 3, 1)) keeps the RGB in order in a copied
 *    buffer and reverses the winding to indices (0, 2, 1); a bare mesh stays
 *    bare.
 * 2. Merging bare, coloured and bare unindexed meshes fills white (1) around the
 *    colours; two coloured meshes keep both in order; an empty and a wholly
 *    bare merge carry no colours.
 * 3. A deformation lifting z by 0.1 inside radius 2 moves the first vertex up and
 *    keeps its RGB.
 */
export function test_engine_geometry_vertex_colour(): void {
  const coloured: IAutoMovieMesh = vertexColourMesh();
  const rgb: number[] = coloured.colors!;
  const bare: IAutoMovieMesh = { ...coloured, colors: undefined };

  // 1.
  const placed: IAutoMovieMesh = AutoMovieEngineGeometry.transformMesh(coloured, {
    scale: { x: -2, y: 3, z: 1 },
  });
  TestValidator.equals("placement keeps RGB", placed.colors, rgb);
  TestValidator.predicate("placement copies RGB", placed.colors !== coloured.colors);
  TestValidator.equals("mirrored winding", placed.indices, [0, 2, 1]);
  TestValidator.equals("bare stays bare", AutoMovieEngineGeometry.transformMesh(bare, {}).colors, undefined);

  // 2.
  TestValidator.equals(
    "white fill",
    AutoMovieEngineGeometry.mergeMeshes([bare, coloured, { ...bare, indices: null }]).colors,
    [...new Array<number>(9).fill(1), ...rgb, ...new Array<number>(9).fill(1)],
  );
  TestValidator.equals(
    "both coloured",
    AutoMovieEngineGeometry.mergeMeshes([coloured, coloured]).colors,
    [...rgb, ...rgb],
  );
  TestValidator.equals("empty", AutoMovieEngineGeometry.mergeMeshes([]).colors, undefined);
  TestValidator.equals("wholly bare", AutoMovieEngineGeometry.mergeMeshes([bare]).colors, undefined);

  // 3.
  const deformed: IAutoMovieMesh = AutoMovieEngineGeometry.createMeshDeformer([
    {
      center: { x: 0, y: 0, z: 0 },
      radius: { x: 2, y: 2, z: 2 },
      displacement: { x: 0, y: 0, z: 0.1 },
      stretch: { x: 0, y: 0, z: 0 },
    },
  ])(coloured);
  TestValidator.predicate("moved", deformed.positions[2]! > 0);
  TestValidator.equals("deformation keeps RGB", deformed.colors, rgb);
}
