import {
  extrudeAutoMovieProfile,
  inspectAutoMovieMeshTopology,
  tessellate,
} from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieMeshTopology } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PROCEDURAL_TEST_SQUARE as square } from "../../../internal/PROCEDURAL_TEST_SQUARE";
import { throwsError } from "../../../internal/predicates";

/**
 * `extrudeAutoMovieProfile` extrudes a convex profile into one closed prism
 * centred on its depth.
 *
 * Fixture: the 2 m procedural test square, depth 0.5 m.
 *
 * Scenarios:
 *
 * 1. 8 vertices and 12 triangles, z from -0.25 to 0.25, watertight, volume 2 x 2
 *    x 0.5 = 2 within 1e-12; it rebuilds to the same numbers.
 * 2. The same corners in a bow-tie order extrude to the same prism (their hull).
 * 3. The primitive box tessellation (2 x 2 x 0.2) keeps its 24 vertices and 12
 *    triangles.
 * 4. Depth 0 ("finite number > 0"), three collinear points ("three
 *    non-collinear points"), an interior point and an L-shaped concave profile
 *    ("must be convex") are refused.
 */
export function test_unit_engine_geometry_extrude_profile(): void {
  // 1.
  const prism: IAutoMovieMesh = extrudeAutoMovieProfile({ profile: square, depth: 0.5 });
  const topology: IAutoMovieMeshTopology = inspectAutoMovieMeshTopology(prism);
  const z: number[] = prism.positions.filter((_: number, i: number): boolean => i % 3 === 2);
  TestValidator.equals("counts", [prism.positions.length, prism.indices!.length], [8 * 3, 12 * 3]);
  TestValidator.equals("depth", [Math.min(...z), Math.max(...z)], [-0.25, 0.25]);
  TestValidator.predicate("closed", topology.watertight && Math.abs(topology.volume - 2) <= 1e-12);
  TestValidator.equals("deterministic", extrudeAutoMovieProfile({ profile: square, depth: 0.5 }), prism);

  // 2.
  TestValidator.equals(
    "bow-tie",
    extrudeAutoMovieProfile({
      profile: [
        { x: -1, y: -1 },
        { x: 1, y: 1 },
        { x: 1, y: -1 },
        { x: -1, y: 1 },
      ],
      depth: 0.5,
    }),
    prism,
  );

  // 3.
  const box = tessellate({ type: "box", width: 2, height: 2, depth: 0.2 });
  TestValidator.equals("primitive box", [box.positions.length, box.indices.length], [24 * 3, 12 * 3]);

  // 4.
  for (const [label, input, message] of [
    ["depth 0", { profile: square, depth: 0 }, "extrusion depth must be a finite number > 0"],
    [
      "collinear",
      { profile: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }], depth: 1 },
      "profile needs at least three non-collinear points",
    ],
    ["interior point", { profile: [...square, { x: 0, y: 0 }], depth: 1 }, "profile must be convex and contain no interior points"],
    [
      "concave",
      {
        profile: [
          { x: 0, y: 0 },
          { x: 3, y: 0 },
          { x: 3, y: 1 },
          { x: 1, y: 1 },
          { x: 1, y: 3 },
          { x: 0, y: 3 },
        ],
        depth: 1,
      },
      "profile must be convex and contain no interior points",
    ],
  ] satisfies [string, Parameters<typeof extrudeAutoMovieProfile>[0], string][])
    TestValidator.predicate(label, throwsError((): unknown => extrudeAutoMovieProfile(input), message));
}
