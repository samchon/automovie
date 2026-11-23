import {
  buildAutoMovieConvexHull,
  inspectAutoMovieMeshTopology,
} from "@automovie/engine";
import type {
  IAutoMovieMeshTopology,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

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
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the hull through the public engine function and measures it with the topology report. It catches a hull that keeps an interior point as a corner, an open or inward-wound mesh, and a placeholder mesh for a flat point set.
 * @evidence contracts/development/testing.md#independent-expectations The volume of the unit cube is 1 by definition, and an outward closed mesh has positive divergence-theorem volume; the coplanar set spans no volume, so no hull exists.
 * @evidence contracts/development/testing.md#distinguishing-cases A volume-spanning set with an interior point and a flat set. Archetype convex cells built through the same function are pinned by test_archetype_convex_cell.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit test of engine geometry with in-memory points; no process, browser, GPU or dynamic registration.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 2 numbered scenarios it runs, each naming the points and the expected result.
 */
export function test_geometry_convex_hull(): void {
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
