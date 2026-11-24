import {
  inspectAutoMovieMeshTopology,
  meshAutoMovieSweep,
} from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieProfilePoint,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PROCEDURAL_TEST_SQUARE as square } from "../../../internal/PROCEDURAL_TEST_SQUARE";
import { equalGeometryTestValues } from "../../../internal/equalGeometryTestValues";
import { namedFacts, nclose, throwsError } from "../../../internal/predicates";

/**
 * A constant polygon section swept along a path, one smooth ring per path
 * point, capped.
 */
const sweep = (
  profile: readonly IAutoMovieProfilePoint[],
  path: IAutoMovieVector3[],
  normal: IAutoMovieVector3,
): IAutoMovieMesh =>
  meshAutoMovieSweep({
    sweep: {
      spine: { points: path, normal },
      stations: [{ at: 0, section: { type: "polygon", points: [...profile] } }],
      correspondence: "parameter",
    },
    shading: "smooth",
  });

/**
 * A constant section swept along bent and vertical paths keeps the exact volume
 * of a straight prism and refuses degenerate paths.
 *
 * Scenarios:
 *
 * 1. A square swept along a horizontal right-angle bend and up a vertical path
 *    both give finite, nonempty meshes, and the vertical sweep of a two-metre
 *    square over two metres encloses eight cubic metres.
 * 2. The same bent sweep rebuilds to identical numbers.
 * 3. A one-point path, a non-finite point and two coincident points are each
 *    refused by the spine's own diagnostic.
 */
export function test_unit_engine_geometry_geometry_procedural_sweep(): void {
  const small: IAutoMovieProfilePoint[] = square.map(
    (point: IAutoMovieProfilePoint): IAutoMovieProfilePoint => ({
      x: point.x * 0.1,
      y: point.y * 0.1,
    }),
  );
  const bend: IAutoMovieVector3[] = [
    { x: 0, y: 0, z: 0 },
    { x: 2, y: 0, z: 0 },
    { x: 2, y: 2, z: 0 },
  ];
  const up: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
  const swept: IAutoMovieMesh = sweep(small, bend, up);
  const vertical: IAutoMovieMesh = sweep(
    square,
    [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 2, z: 0 },
    ],
    { x: 1, y: 0, z: 0 },
  );
  TestValidator.equals(
    "sweeps cover horizontal bends and vertical paths",
    namedFacts([
      ["bent", (): boolean => swept.indices!.length > 0],
      ["vertical", (): boolean => vertical.indices!.length > 0],
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
    equalGeometryTestValues(sweep(small, bend, up), swept),
  );

  const invalids: Array<readonly [string, () => unknown, string]> = [
    [
      "sweep path",
      (): IAutoMovieMesh => sweep(square, [{ x: 0, y: 0, z: 0 }], up),
      "sweep spine needs at least two points",
    ],
    [
      "sweep coincident",
      (): IAutoMovieMesh =>
        sweep(
          square,
          [
            { x: 0, y: 0, z: 0 },
            { x: 0, y: 0, z: 0 },
          ],
          up,
        ),
      "sweep spine points 0 and 1 coincide",
    ],
  ];
  for (const [name, callback, message] of invalids)
    TestValidator.predicate(
      `${name} is refused by its own diagnostic`,
      throwsError(callback, message),
    );
}
