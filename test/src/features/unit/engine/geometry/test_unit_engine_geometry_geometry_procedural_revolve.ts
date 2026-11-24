import {
  inspectAutoMovieMeshTopology,
  revolveAutoMovieProfile,
} from "@automovie/engine";
import { type IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PROCEDURAL_TEST_SQUARE as square } from "../../../internal/PROCEDURAL_TEST_SQUARE";
import { equalGeometryTestValues } from "../../../internal/equalGeometryTestValues";
import { namedFacts, throwsError } from "../../../internal/predicates";

/**
 * Revolution retains its ring count, closed seam and reported pole degeneracy,
 * with segment/radius/profile admission unchanged.
 *
 * Scenarios:
 *
 * 1. Authored positive geometry retains its independent topology and dimensional
 *    expectations.
 * 2. Every associated invalid row refuses at the same diagnostic beside supported
 *    input.
 */
export function test_unit_engine_geometry_geometry_procedural_revolve(): void {
  const revolved: IAutoMovieMesh = revolveAutoMovieProfile({
    profile: [
      { x: 0, y: -1 },
      { x: 1, y: -1 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ],
    segments: 8,
  });
  TestValidator.equals(
    "a radius profile revolves with a closed seam and reported pole degeneracy",
    namedFacts([
      ["rings", (): boolean => revolved.positions.length === 9 * 4 * 3],
      ["triangles", (): boolean => revolved.indices!.length === 8 * 3 * 2 * 3],
      [
        "poles",
        (): boolean =>
          inspectAutoMovieMeshTopology(revolved).degenerate === 8 * 2,
      ],
    ]),
    { rings: true, triangles: true, poles: true },
  );

  TestValidator.predicate(
    "revolution is deterministic at the same authored profile",
    equalGeometryTestValues(
      revolveAutoMovieProfile({
        profile: [
          { x: 0, y: -1 },
          { x: 1, y: -1 },
          { x: 1, y: 1 },
          { x: 0, y: 1 },
        ],
        segments: 8,
      }),
      revolved,
    ),
  );

  const invalids: Array<readonly [string, () => unknown, string]> = [
    [
      "revolve points",
      (): IAutoMovieMesh =>
        revolveAutoMovieProfile({ profile: [{ x: 1, y: 0 }], segments: 8 }),
      "revolve profile needs at least two points",
    ],
    [
      "revolve segments",
      (): IAutoMovieMesh =>
        revolveAutoMovieProfile({ profile: square, segments: 2 }),
      "revolve segments must be a safe integer >= 3",
    ],
    [
      "revolve radius",
      (): IAutoMovieMesh =>
        revolveAutoMovieProfile({
          profile: [
            { x: -1, y: 0 },
            { x: 1, y: 1 },
          ],
          segments: 8,
        }),
      "revolve profile[0] radius must be >= 0",
    ],
  ];
  for (const [name, callback, message] of invalids)
    TestValidator.predicate(
      `${name} is refused by its own diagnostic`,
      throwsError(callback, message),
    );
}
