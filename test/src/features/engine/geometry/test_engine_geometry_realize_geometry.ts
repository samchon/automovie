import { AutoMovieEngineGeometry } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMoviePrimitiveShape,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createBicubicPlaneRecipe } from "../../internal/createBicubicPlaneRecipe";
import { throwsError } from "../../internal/throwsError";

/**
 * `realizeGeometry(geometry, requirement?)` resolves a geometry recipe
 * through its owner: a primitive tessellates, a mesh is borrowed, a bicubic
 * atlas realizes, and only "complete" refuses an incomplete atlas.
 *
 * Scenarios:
 *
 * 1. A unit box primitive equals `tessellateToMesh` of it, complete, no
 *    diagnostics.
 * 2. A mesh is returned as the same object.
 * 3. The bicubic plane equals `realizeBicubicAtlas64` of it.
 * 4. An eight-patch elliptic loft atlas limited to one cell is incomplete: shown
 *    for "display", refused for "complete" ("Bicubic atlas processing is
 *    incomplete").
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names dispatch to each recipe owner, mesh reference identity and the difference between display and complete processing.
 * @evidence contracts/development/testing.md#behavioral-verification Dispatches primitive, mesh and atlas inputs, comparing the generated data with the direct owner and querying both policies on an exhausted atlas.
 * @evidence contracts/development/testing.md#independent-expectations Dispatch should return the exact mesh input reference or the matched owner's result. A one-cell budget cannot process every patch of the eight-patch fixture.
 */
export function test_engine_geometry_realize_geometry(): void {
  // 1.
  const shape: IAutoMoviePrimitiveShape = {
    type: "box",
    width: 1,
    height: 1,
    depth: 1,
  };
  TestValidator.equals(
    "primitive",
    AutoMovieEngineGeometry.realizeGeometry({ type: "primitive", shape }),
    {
      mesh: AutoMovieEngineGeometry.tessellateToMesh(shape),
      complete: true,
      diagnostics: [],
    },
  );

  // 2.
  const mesh: IAutoMovieMesh = {
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    indices: [0, 1, 2],
    normals: null,
    uvs: null,
    skin: null,
  };
  TestValidator.predicate(
    "borrowed",
    AutoMovieEngineGeometry.realizeGeometry({ type: "mesh", mesh }).mesh ===
      mesh,
  );

  // 3.
  const plane = createBicubicPlaneRecipe();
  TestValidator.equals(
    "atlas",
    AutoMovieEngineGeometry.realizeGeometry(plane),
    AutoMovieEngineGeometry.realizeBicubicAtlas64(plane),
  );

  // 4.
  const starved = AutoMovieEngineGeometry.createEllipticLoftAtlas({
    loft: {
      spans: [0, 1].map((i: number) => ({
        interval: {
          lowerY: i * 0.05,
          upperY: (i + 1) * 0.05,
        },
        radiusX: [0.02, 0.02, 0.02, 0.02] satisfies [
          number,
          number,
          number,
          number,
        ],
        radiusZ: [0.01, 0.01, 0.01, 0.01] satisfies [
          number,
          number,
          number,
          number,
        ],
        centreX: [0, 0, 0, 0] satisfies [number, number, number, number],
        centreZ: [0, 0, 0, 0] satisfies [number, number, number, number],
      })),
    },
    topologyDomain: "analytic-cylinder",
    tolerance: 0.0001,
    maxCells: 1,
    maxVertices: 30_000,
  }).geometry;
  TestValidator.equals(
    "display",
    AutoMovieEngineGeometry.realizeGeometry(starved).complete,
    false,
  );
  TestValidator.predicate(
    "complete",
    throwsError(
      (): unknown =>
        AutoMovieEngineGeometry.realizeGeometry(starved, "complete"),
      "Bicubic atlas processing is incomplete",
    ),
  );
}
