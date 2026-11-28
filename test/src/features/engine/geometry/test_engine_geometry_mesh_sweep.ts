import { AutoMovieEngineGeometry, AutoMovieEngineSweep } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieProfilePoint,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PROCEDURAL_TEST_SQUARE as square } from "../../internal/PROCEDURAL_TEST_SQUARE";
import { throwsError } from "../../internal/predicates";

/**
 * `meshSweep` sweeps one constant polygon section along a path, one
 * smooth ring per path point, capped.
 *
 * Fixture: the 2 m procedural test square, and the same square scaled by 0.1.
 *
 * Scenarios:
 *
 * 1. The small square along the horizontal bend (0,0,0), (2,0,0), (2,2,0) meshes;
 *    the 2 m square up the 2 m vertical path encloses 2 x 2 x 2 = 8 m^3 within
 *    1e-12.
 * 2. The bent sweep rebuilds to the same numbers.
 * 3. A one-point path ("needs at least two points") and two coincident points
 *    ("points 0 and 1 coincide") are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names a bent and a vertical sweep, deterministic mesh and invalid paths.
 * @evidence contracts/development/testing.md#behavioral-verification Sweeps procedural square sections along actual paths, inspecting volume and comparing the repeated result and short or coincident refusals.
 * @evidence contracts/development/testing.md#independent-expectations A 2 by 2 square on a straight 2 m path encloses a prism of volume 8. A one-point or zero-length path has no valid sweep segment.
 */
export function test_engine_geometry_mesh_sweep(): void {
  const sweep = (
    profile: readonly IAutoMovieProfilePoint[],
    path: IAutoMovieVector3[],
    normal: IAutoMovieVector3,
  ): IAutoMovieMesh =>
    AutoMovieEngineSweep.meshSweep({
      sweep: {
        spine: { points: path, normal },
        stations: [{ at: 0, section: { type: "polygon", points: [...profile] } }],
        correspondence: "parameter",
      },
      shading: "smooth",
    });
  const small: IAutoMovieProfilePoint[] = square.map(
    (p: IAutoMovieProfilePoint): IAutoMovieProfilePoint => ({ x: p.x * 0.1, y: p.y * 0.1 }),
  );
  const bend: IAutoMovieVector3[] = [
    { x: 0, y: 0, z: 0 },
    { x: 2, y: 0, z: 0 },
    { x: 2, y: 2, z: 0 },
  ];
  const up: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };

  // 1.
  const bent: IAutoMovieMesh = sweep(small, bend, up);
  TestValidator.predicate("bent meshes", bent.indices!.length > 0);
  const vertical: IAutoMovieMesh = sweep(
    square,
    [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 2, z: 0 },
    ],
    { x: 1, y: 0, z: 0 },
  );
  TestValidator.predicate(
    "vertical volume",
    Math.abs(AutoMovieEngineGeometry.inspectMeshTopology(vertical).volume - 8) <= 1e-12,
  );

  // 2.
  TestValidator.equals("deterministic", sweep(small, bend, up), bent);

  // 3.
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  TestValidator.predicate(
    "one point",
    throwsError((): unknown => sweep(square, [origin], up), "sweep spine needs at least two points"),
  );
  TestValidator.predicate(
    "coincident",
    throwsError(
      (): unknown => sweep(square, [origin, { ...origin }], up),
      "sweep spine points 0 and 1 coincide",
    ),
  );
}
