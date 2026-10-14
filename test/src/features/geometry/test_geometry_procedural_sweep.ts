import { inspectAutoMovieMeshTopology, sweepAutoMovieProfile, type IAutoMovieProfilePoint } from "@automovie/engine";
import { type IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";


import { PROCEDURAL_TEST_SQUARE as square } from "../internal/PROCEDURAL_TEST_SQUARE";
import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";
import { isFiniteProceduralMesh as finiteMesh } from "../internal/isFiniteProceduralMesh";
import { namedFacts, nclose, throwsError } from "../internal/predicates";

/**
 * Sweep frames preserve bent and vertical paths, exact volume and degenerate path refusal.
 *
 * Scenarios:
 * 1. Authored positive geometry retains its independent topology and dimensional expectations.
 * 2. Every associated invalid row refuses at the same diagnostic beside supported input.
 *
 * @evidence contracts/testing.md#behavioral-verification Sweeps the existing horizontal bend and vertical square path, asserting nonempty finite observed buffers, the vertical prism's volume and exact bent rebuild. Short, nonfinite and repeated-point paths must refuse by their original diagnostics.
 * @evidence contracts/testing.md#independent-expectations The vertical two-metre-square section carried two metres encloses eight cubic metres. Repeating the same bend tests deterministic finite values/structure rather than independently expected bent geometry. finiteMesh does not admit every attribute, and topology volume and buffer success do not establish arbitrary self-intersection freedom or rendered appearance.
 * @evidence contracts/testing.md#distinguishing-cases Preserves horizontal turn versus vertical frame seeding, the independent straight-prism volume, identical bent reconstruction and three malformed path twins. Profile convexity, transported frame laws and atlas-bearing loft behavior belong to their own entries.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry directly executes portable sweep/frame/topology source on its original paths and canonical observers. It installs no consumer, builds no native artifact and starts no process, browser or GPU; it owns its cases without dynamic registration.
 */
export function test_geometry_procedural_sweep(): void {
  const swept: IAutoMovieMesh = sweepAutoMovieProfile({
    profile: square.map(
      (point: IAutoMovieProfilePoint): IAutoMovieProfilePoint => ({
        x: point.x * 0.1,
        y: point.y * 0.1,
      }),
    ),
    path: [
      { x: 0, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 2, y: 2, z: 0 },
    ],
  });
  const vertical: IAutoMovieMesh = sweepAutoMovieProfile({
    profile: square,
    path: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 2, z: 0 },
    ],
  });
  TestValidator.equals(
    "sweeps cover horizontal bends and the vertical frame fallback",
    namedFacts([
      ["bent", (): boolean => finiteMesh(swept) && swept.indices!.length > 0],
      [
        "vertical",
        (): boolean => finiteMesh(vertical) && vertical.indices!.length > 0,
      ],
      [
        "verticalVolume",
        (): boolean =>
          nclose(
            inspectAutoMovieMeshTopology(vertical).volume,
            2 * 2 * 2,
            1e-12,
          ),
      ],
    ]),
    { bent: true, vertical: true, verticalVolume: true },
  );

  TestValidator.predicate(
    "bent sweep reproduces its authored geometry",
    equalGeometryTestValues(
      sweepAutoMovieProfile({
        profile: square.map(
          (point: IAutoMovieProfilePoint): IAutoMovieProfilePoint => ({
            x: point.x * 0.1,
            y: point.y * 0.1,
          }),
        ),
        path: [
          { x: 0, y: 0, z: 0 },
          { x: 2, y: 0, z: 0 },
          { x: 2, y: 2, z: 0 },
        ],
      }),
      swept,
    ),
  );

  const invalids: Array<readonly [string, () => unknown, string]> = [
    [
      "sweep path",
      (): IAutoMovieMesh =>
        sweepAutoMovieProfile({
          profile: square,
          path: [{ x: 0, y: 0, z: 0 }],
        }),
      "sweep path needs at least two points",
    ],
    [
      "sweep finite",
      (): IAutoMovieMesh =>
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
      (): IAutoMovieMesh =>
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
  for (const [name, callback, message] of invalids)
    TestValidator.predicate(
      `${name} is refused by its own diagnostic`,
      throwsError(callback, message),
    );
}
