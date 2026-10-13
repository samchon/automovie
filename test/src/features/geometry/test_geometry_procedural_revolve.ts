import {inspectAutoMovieMeshTopology,revolveAutoMovieProfile} from "@automovie/engine";
import {TestValidator} from "@nestia/e2e";
import {namedFacts,throwsError} from "../internal/predicates";
import { PROCEDURAL_TEST_SQUARE as square } from "../internal/PROCEDURAL_TEST_SQUARE";
import {isFiniteProceduralMesh as finiteMesh} from "../internal/isFiniteProceduralMesh";

/**
 * Revolution retains its ring count, closed seam and reported pole degeneracy, with segment/radius/profile admission unchanged.
 *
 * Scenarios:
 * 1. Authored positive geometry retains its independent topology and dimensional expectations.
 * 2. Every associated invalid row refuses at the same diagnostic beside supported input.
 */
export const test_geometry_procedural_revolve=():void=>{
  const revolved = revolveAutoMovieProfile({
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
      ["finite", () => finiteMesh(revolved)],
      ["rings", () => revolved.positions.length === 9 * 4 * 3],
      ["triangles", () => revolved.indices!.length === 8 * 3 * 2 * 3],
      [
        "poles",
        () => inspectAutoMovieMeshTopology(revolved).degenerate === 8 * 2,
      ],
    ]),
    { finite: true, rings: true, triangles: true, poles: true },
  );


  TestValidator.equals("revolution is deterministic at the same authored profile",JSON.stringify(revolveAutoMovieProfile({profile:[{x:0,y:-1},{x:1,y:-1},{x:1,y:1},{x:0,y:1}],segments:8})),JSON.stringify(revolved));

  const invalids: Array<readonly [string, () => unknown, string]> = [
    [
      "revolve points",
      () => revolveAutoMovieProfile({ profile: [{ x: 1, y: 0 }], segments: 8 }),
      "revolve profile needs at least two points",
    ],
    [
      "revolve segments",
      () => revolveAutoMovieProfile({ profile: square, segments: 2 }),
      "revolve segments must be a safe integer >= 3",
    ],
    [
      "revolve fractional segments",
      () => revolveAutoMovieProfile({ profile: square, segments: 3.5 }),
      "revolve segments must be a safe integer >= 3",
    ],
    [
      "revolve finite",
      () =>
        revolveAutoMovieProfile({
          profile: [
            { x: 1, y: Number.NaN },
            { x: 1, y: 1 },
          ],
          segments: 8,
        }),
      "revolve profile[0] must be finite",
    ],
    [
      "revolve radius",
      () =>
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
  for (const [name, callback, message] of invalids) TestValidator.predicate(`${name} is refused by its own diagnostic`,throwsError(callback,message));

};
