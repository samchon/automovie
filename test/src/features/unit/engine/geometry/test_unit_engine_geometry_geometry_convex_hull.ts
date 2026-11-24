import {
  buildAutoMovieConvexHull,
  inspectAutoMovieMeshTopology,
} from "@automovie/engine";
import type {
  IAutoMovieMeshTopology,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../../../internal/predicates";

/**
 * The convex hull of a point set is one closed outward mesh, and a point set
 * spanning no volume is refused.
 *
 * The unit cube's eight corners bound a volume of exactly 1 m3, and its centre
 * lies inside and adds no corner, so the hull is the cube itself.
 *
 * Scenarios:
 *
 * 1. The unit cube's corners plus its centre give a watertight mesh with volume 1
 *    within 1e-12.
 * 2. Four coplanar points throw.
 */
export function test_unit_engine_geometry_geometry_convex_hull(): void {
  const corners: IAutoMovieVector3[] = [];
  for (let corner: number = 0; corner < 8; ++corner)
    corners.push({ x: corner & 1, y: (corner >> 1) & 1, z: (corner >> 2) & 1 });
  const topology: IAutoMovieMeshTopology = inspectAutoMovieMeshTopology(
    buildAutoMovieConvexHull([...corners, { x: 0.5, y: 0.5, z: 0.5 }]),
  );
  TestValidator.predicate(
    "the hull of a cube and its centre is the closed unit cube",
    topology.watertight && nclose(topology.volume, 1, 1e-12),
  );
  TestValidator.predicate(
    "four coplanar points have no hull",
    throwsError(() =>
      buildAutoMovieConvexHull([
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 1, y: 1, z: 0 },
        { x: 0, y: 1, z: 0 },
      ]),
    ),
  );
}
