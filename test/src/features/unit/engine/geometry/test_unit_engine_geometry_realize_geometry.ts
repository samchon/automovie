import {
  realizeAutoMovieBicubicAtlas64,
  realizeAutoMovieGeometry,
  tessellateToMesh,
} from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createBicubicPlaneRecipe } from "../../../internal/createBicubicPlaneRecipe";
import { throwsError } from "../../../internal/throwsError";

/**
 * `realizeAutoMovieGeometry(geometry, requirement?)` resolves a geometry recipe
 * through its owner: a primitive tessellates, a mesh is borrowed, a bicubic
 * atlas realizes, and only "complete" refuses an incomplete atlas.
 *
 * Scenarios:
 *
 * 1. A unit box primitive equals `tessellateToMesh` of it, complete, no
 *    diagnostics.
 * 2. A mesh is returned as the same object.
 * 3. The bicubic plane equals `realizeAutoMovieBicubicAtlas64` of it.
 * 4. The plane limited to one cell is incomplete: shown for "display", refused
 *    for "complete" ("Bicubic atlas processing is incomplete").
 */
export function test_unit_engine_geometry_realize_geometry(): void {
  // 1.
  const shape = { type: "box" as const, width: 1, height: 1, depth: 1 };
  TestValidator.equals("primitive", realizeAutoMovieGeometry({ type: "primitive", shape }), {
    mesh: tessellateToMesh(shape),
    complete: true,
    diagnostics: [],
  });

  // 2.
  const mesh: IAutoMovieMesh = { positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], indices: [0, 1, 2], normals: null, uvs: null, skin: null };
  TestValidator.predicate("borrowed", realizeAutoMovieGeometry({ type: "mesh", mesh }).mesh === mesh);

  // 3.
  const plane = createBicubicPlaneRecipe();
  TestValidator.equals("atlas", realizeAutoMovieGeometry(plane), realizeAutoMovieBicubicAtlas64(plane));

  // 4.
  const starved = { ...plane, maxCells: 1 };
  TestValidator.equals("display", realizeAutoMovieGeometry(starved).complete, false);
  TestValidator.predicate(
    "complete",
    throwsError((): unknown => realizeAutoMovieGeometry(starved, "complete"), "Bicubic atlas processing is incomplete"),
  );
}
