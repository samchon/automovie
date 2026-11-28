import { AutoMovieEngineGeometry } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/predicates";

/**
 * `revolveProfile` turns a radius profile about the y axis into a
 * closed-seam ring mesh.
 *
 * Fixture: the profile (0,-1), (1,-1), (1,1), (0,1) at 8 segments.
 *
 * Scenarios:
 *
 * 1. 9 rings (the seam repeated) of 4 points, 8 x 3 x 2 triangles, and the 8 x 2
 *    triangles at the two poles reported degenerate; the same input revolves
 *    to the same mesh.
 * 2. One point ("needs at least two points"), 2 segments ("a safe integer >= 3")
 *    and a negative radius ("profile[0] radius must be >= 0") are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names shared seam rings, pole triangles, deterministic output and malformed profiles.
 * @evidence contracts/development/testing.md#behavioral-verification Revolves a four-point radius profile, inspects emitted indices and degenerate triangle receipts, and varies the point, segment and radius inputs.
 * @evidence contracts/development/testing.md#independent-expectations Eight segments plus the repeated seam give nine rings. Three bands with two triangles per segment give 48 faces. Collapsed poles give the stated degeneracies.
 */
export function test_engine_geometry_revolve_profile(): void {
  const profile = [
    { x: 0, y: -1 },
    { x: 1, y: -1 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ];

  // 1.
  const revolved: IAutoMovieMesh = AutoMovieEngineGeometry.revolveProfile({ profile, segments: 8 });
  TestValidator.equals(
    "counts",
    [
      revolved.positions.length,
      revolved.indices!.length,
      AutoMovieEngineGeometry.inspectMeshTopology(revolved).degenerate,
    ],
    [9 * 4 * 3, 8 * 3 * 2 * 3, 8 * 2],
  );
  TestValidator.equals("deterministic", AutoMovieEngineGeometry.revolveProfile({ profile, segments: 8 }), revolved);

  // 2.
  for (const [label, input, message] of [
    ["one point", { profile: [{ x: 1, y: 0 }], segments: 8 }, "revolve profile needs at least two points"],
    ["two segments", { profile, segments: 2 }, "revolve segments must be a safe integer >= 3"],
    [
      "negative radius",
      { profile: [{ x: -1, y: 0 }, { x: 1, y: 1 }], segments: 8 },
      "revolve profile[0] radius must be >= 0",
    ],
  ] satisfies [string, Parameters<typeof AutoMovieEngineGeometry.revolveProfile>[0], string][])
    TestValidator.predicate(label, throwsError((): unknown => AutoMovieEngineGeometry.revolveProfile(input), message));
}
