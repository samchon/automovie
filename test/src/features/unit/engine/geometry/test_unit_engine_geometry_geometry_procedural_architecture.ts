import {
  extrudeAutoMovieProfile,
  inspectAutoMovieMeshTopology,
  tessellate,
} from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieMeshTopology,
  IAutoMovieTessellation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PROCEDURAL_TEST_SQUARE as square } from "../../../internal/PROCEDURAL_TEST_SQUARE";
import { equalGeometryTestValues } from "../../../internal/equalGeometryTestValues";
import { namedFacts, nclose, throwsError } from "../../../internal/predicates";

/**
 * Convex extrusion retains closed volume, convex admission and primitive
 * compatibility. Each guard keeps its original positive neighbor and
 * diagnostic.
 *
 * Scenarios:
 *
 * 1. Authored positive geometry retains its independent topology and dimensional
 *    expectations.
 * 2. Every associated invalid row refuses at the same diagnostic beside supported
 *    input.
 */
export function test_unit_engine_geometry_geometry_procedural_architecture(): void {
  const extrusion: IAutoMovieMesh = extrudeAutoMovieProfile({
    profile: square,
    depth: 0.5,
  });
  const extrusionTopology: IAutoMovieMeshTopology =
    inspectAutoMovieMeshTopology(extrusion);
  TestValidator.equals(
    "a convex profile extrudes to one closed prism of the authored volume",
    namedFacts([
      ["vertices", (): boolean => extrusion.positions.length === 8 * 3],
      ["triangles", (): boolean => extrusion.indices!.length === 12 * 3],
      [
        "depth",
        (): boolean =>
          nclose(
            Math.min(
              ...extrusion.positions.filter(
                (_: number, index: number): boolean => index % 3 === 2,
              ),
            ),
            -0.25,
            0,
          ) &&
          nclose(
            Math.max(
              ...extrusion.positions.filter(
                (_: number, index: number): boolean => index % 3 === 2,
              ),
            ),
            0.25,
            0,
          ),
      ],
      ["watertight", (): boolean => extrusionTopology.watertight],
      [
        "volume",
        (): boolean => nclose(extrusionTopology.volume, 2 * 2 * 0.5, 1e-12),
      ],
    ]),
    {
      vertices: true,
      triangles: true,
      depth: true,
      watertight: true,
      volume: true,
    },
  );

  TestValidator.predicate(
    "extrusion rebuilds with exact finite numeric values and structure",
    equalGeometryTestValues(
      extrudeAutoMovieProfile({ profile: square, depth: 0.5 }),
      extrusion,
    ),
  );
  const box: IAutoMovieTessellation = tessellate({
    type: "box",
    width: 2,
    height: 2,
    depth: 0.2,
  });
  TestValidator.equals(
    "existing primitive tessellation is untouched by the procedural kernel",
    { vertices: box.positions.length, indices: box.indices.length },
    { vertices: 24 * 3, indices: 12 * 3 },
  );

  TestValidator.predicate(
    "a bow-tie ordering of convex-position points is normalized to its hull, not refused",
    equalGeometryTestValues(
      extrudeAutoMovieProfile({
        profile: [
          { x: -1, y: -1 },
          { x: 1, y: 1 },
          { x: 1, y: -1 },
          { x: -1, y: 1 },
        ],
        depth: 0.5,
      }),
      extrusion,
    ),
  );
  const invalids: Array<readonly [string, () => unknown, string]> = [
    [
      "extrusion depth",
      (): IAutoMovieMesh =>
        extrudeAutoMovieProfile({ profile: square, depth: 0 }),
      "extrusion depth must be a finite number > 0",
    ],
    [
      "profile area",
      (): IAutoMovieMesh =>
        extrudeAutoMovieProfile({
          profile: [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 2, y: 0 },
          ],
          depth: 1,
        }),
      "profile needs at least three non-collinear points",
    ],
    [
      "profile convexity",
      (): IAutoMovieMesh =>
        extrudeAutoMovieProfile({
          profile: [...square, { x: 0, y: 0 }],
          depth: 1,
        }),
      "profile must be convex and contain no interior points",
    ],
    [
      "concave profile",
      (): IAutoMovieMesh =>
        extrudeAutoMovieProfile({
          profile: [
            { x: 0, y: 0 },
            { x: 3, y: 0 },
            { x: 3, y: 1 },
            { x: 1, y: 1 },
            { x: 1, y: 3 },
            { x: 0, y: 3 },
          ],
          depth: 1,
        }),
      "profile must be convex and contain no interior points",
    ],
  ];
  for (const [name, callback, message] of invalids)
    TestValidator.predicate(
      `${name} is refused by its own diagnostic`,
      throwsError(callback, message),
    );
}
