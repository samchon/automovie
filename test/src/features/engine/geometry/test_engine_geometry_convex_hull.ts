import { AutoMovieEngineGeometry } from "@automovie/engine";
import type {
  IAutoMovieMeshTopology,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../../internal/predicates";

/**
 * `buildConvexHull` makes one closed outward mesh of a point set.
 *
 * Scenarios:
 *
 * 1. The unit cube's eight corners plus its centre (which adds no corner) give a
 *    watertight mesh of volume exactly 1 within 1e-12.
 * 2. Four coplanar points (the unit square in z = 0) span no volume and are
 *    refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names volume and closure for a cube with an interior point and the coplanar refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Builds the hull and reads its topology and integrated volume. Calls the same owner with a unit square in one plane.
 * @evidence contracts/development/testing.md#independent-expectations The unit cube has volume 1 and its centre adds no hull vertex. Four coplanar points enclose no three-dimensional volume.
 */
export function test_engine_geometry_convex_hull(): void {
  const corners: IAutoMovieVector3[] = [];
  for (let corner: number = 0; corner < 8; ++corner)
    corners.push({ x: corner & 1, y: (corner >> 1) & 1, z: (corner >> 2) & 1 });
  const topology: IAutoMovieMeshTopology = AutoMovieEngineGeometry.inspectMeshTopology(
    AutoMovieEngineGeometry.buildConvexHull([...corners, { x: 0.5, y: 0.5, z: 0.5 }]),
  );
  TestValidator.equals("watertight", topology.watertight, true);
  TestValidator.predicate("volume", nclose(topology.volume, 1, 1e-12));
  TestValidator.predicate(
    "coplanar",
    throwsError(() =>
      AutoMovieEngineGeometry.buildConvexHull([
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 1, y: 1, z: 0 },
        { x: 0, y: 1, z: 0 },
      ]),
    ),
  );
}
