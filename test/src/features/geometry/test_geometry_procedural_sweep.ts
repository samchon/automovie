import {inspectAutoMovieMeshTopology,sweepAutoMovieProfile} from "@automovie/engine";
import {TestValidator} from "@nestia/e2e";
import {namedFacts,nclose,throwsError} from "../internal/predicates";
import { PROCEDURAL_TEST_SQUARE as square } from "../internal/PROCEDURAL_TEST_SQUARE";
import {isFiniteProceduralMesh as finiteMesh} from "../internal/isFiniteProceduralMesh";

/**
 * Sweep frames preserve bent and vertical paths, exact volume and degenerate path refusal.
 *
 * Scenarios:
 * 1. Authored positive geometry retains its independent topology and dimensional expectations.
 * 2. Every associated invalid row refuses at the same diagnostic beside supported input.
 */
export const test_geometry_procedural_sweep=():void=>{
  const swept = sweepAutoMovieProfile({
    profile: square.map((point) => ({ x: point.x * 0.1, y: point.y * 0.1 })),
    path: [
      { x: 0, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 2, y: 2, z: 0 },
    ],
  });
  const vertical = sweepAutoMovieProfile({
    profile: square,
    path: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 2, z: 0 },
    ],
  });
  TestValidator.equals(
    "sweeps cover horizontal bends and the vertical frame fallback",
    namedFacts([
      ["bent", () => finiteMesh(swept) && swept.indices!.length > 0],
      ["vertical", () => finiteMesh(vertical) && vertical.indices!.length > 0],
      [
        "verticalVolume",
        () =>
          nclose(
            inspectAutoMovieMeshTopology(vertical).volume,
            2 * 2 * 2,
            1e-12,
          ),
      ],
    ]),
    { bent: true, vertical: true, verticalVolume: true },
  );


  TestValidator.equals("bent sweep reproduces its authored geometry",JSON.stringify(sweepAutoMovieProfile({profile:square.map(point=>({x:point.x*.1,y:point.y*.1})),path:[{x:0,y:0,z:0},{x:2,y:0,z:0},{x:2,y:2,z:0}]})),JSON.stringify(swept));

  const invalids: Array<readonly [string, () => unknown, string]> = [
    [
      "sweep path",
      () =>
        sweepAutoMovieProfile({
          profile: square,
          path: [{ x: 0, y: 0, z: 0 }],
        }),
      "sweep path needs at least two points",
    ],
    [
      "sweep finite",
      () =>
        sweepAutoMovieProfile({
          profile: square,
          path: [
            { x: 0, y: 0, z: 0 },
            { x: Number.NaN, y: 1, z: 0 },
          ],
        }),
      "sweep path[1] must be finite",
    ],
    [
      "sweep frame",
      () =>
        sweepAutoMovieProfile({
          profile: square,
          path: [
            { x: 0, y: 0, z: 0 },
            { x: 0, y: 0, z: 0 },
          ],
        }),
      "sweep path around point 0 is degenerate",
    ],
  ];
  for (const [name, callback, message] of invalids) TestValidator.predicate(`${name} is refused by its own diagnostic`,throwsError(callback,message));

};
