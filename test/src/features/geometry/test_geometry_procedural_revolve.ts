import {inspectAutoMovieMeshTopology,revolveAutoMovieProfile} from "@automovie/engine";
import {TestValidator} from "@nestia/e2e";
import {namedFacts,throwsError} from "../internal/predicates";
import { PROCEDURAL_TEST_SQUARE as square } from "../internal/PROCEDURAL_TEST_SQUARE";
import {isFiniteProceduralMesh as finiteMesh} from "../internal/isFiniteProceduralMesh";
import { type IAutoMovieMesh } from "@automovie/interface";
import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";

/**
 * Revolution retains its ring count, closed seam and reported pole degeneracy, with segment/radius/profile admission unchanged.
 *
 * Scenarios:
 * 1. Authored positive geometry retains its independent topology and dimensional expectations.
 * 2. Every associated invalid row refuses at the same diagnostic beside supported input.
 *
 * @evidence contracts/testing.md#behavioral-verification Revolves the existing axis-ended radius profile and asserts emitted vertex/triangle counts, finite visited coordinates/normals and integral indices, pole-degenerate count and exact rebuild. Invalid profile population, segment count/fraction, nonfinite coordinate and negative radius must refuse by their original diagnostics.
 * @evidence contracts/testing.md#independent-expectations Eight angular divisions require nine seam-inclusive stations of four profile points and two triangles per three profile spans per division. Each of the two axis ends contributes eight collapsed triangles. Rebuild equality observes determinism, not independent geometry; finiteMesh is a partial observer and the topology count does not establish rendered closure or global embedding.
 * @evidence contracts/testing.md#distinguishing-cases Preserves the axis-ended profile, explicit seam population, pole degeneracy and repeat construction plus five original short-profile/segment/finite/radius refusals. Open tubes, UV seam normals and atlas distortion have separate test owners.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry directly calls portable revolution and topology source with the existing authored profile and canonical observers. It installs no consumer, builds no native artifact and starts no host, browser or GPU; it registers no additional cases.
 */
export function test_geometry_procedural_revolve(): void {
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
      ["finite", (): boolean => finiteMesh(revolved)],
      ["rings", (): boolean => revolved.positions.length === 9 * 4 * 3],
      ["triangles", (): boolean => revolved.indices!.length === 8 * 3 * 2 * 3],
      [
        "poles",
        (): boolean => inspectAutoMovieMeshTopology(revolved).degenerate === 8 * 2,
      ],
    ]),
    { finite: true, rings: true, triangles: true, poles: true },
  );


  TestValidator.predicate("revolution is deterministic at the same authored profile",equalGeometryTestValues(revolveAutoMovieProfile({profile:[{x:0,y:-1},{x:1,y:-1},{x:1,y:1},{x:0,y:1}],segments:8}),revolved));

  const invalids: Array<readonly [string, () => unknown, string]> = [
    [
      "revolve points",
      (): IAutoMovieMesh => revolveAutoMovieProfile({ profile: [{ x: 1, y: 0 }], segments: 8 }),
      "revolve profile needs at least two points",
    ],
    [
      "revolve segments",
      (): IAutoMovieMesh => revolveAutoMovieProfile({ profile: square, segments: 2 }),
      "revolve segments must be a safe integer >= 3",
    ],
    [
      "revolve fractional segments",
      (): IAutoMovieMesh => revolveAutoMovieProfile({ profile: square, segments: 3.5 }),
      "revolve segments must be a safe integer >= 3",
    ],
    [
      "revolve finite",
      (): IAutoMovieMesh =>
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
  for (const [name, callback, message] of invalids) TestValidator.predicate(`${name} is refused by its own diagnostic`,throwsError(callback,message));

}
