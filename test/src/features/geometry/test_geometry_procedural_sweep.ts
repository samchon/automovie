import {
  type IAutoMovieProfilePoint,
  inspectAutoMovieMeshTopology,
  meshAutoMovieSweep,
} from "@automovie/engine";
import { type IAutoMovieMesh, type IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PROCEDURAL_TEST_SQUARE as square } from "../internal/PROCEDURAL_TEST_SQUARE";
import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";
import { isFiniteProceduralMesh as finiteMesh } from "../internal/isFiniteProceduralMesh";
import { namedFacts, nclose, throwsError } from "../internal/predicates";

/** A constant polygon section swept along a path, one smooth ring per path point, capped. */
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
 * A constant section swept along bent and vertical paths keeps the exact volume of a straight prism and refuses degenerate paths.
 *
 * Scenarios:
 * 1. A square swept along a horizontal right-angle bend and up a vertical path both give finite, nonempty meshes, and the vertical sweep of a two-metre square over two metres encloses eight cubic metres.
 * 2. The same bent sweep rebuilds to identical numbers.
 * 3. A one-point path, a non-finite point and two coincident points are each refused by the spine's own diagnostic.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs `meshAutoMovieSweep` on a bent and a vertical path, asserting finite buffers, the vertical prism's volume through `inspectAutoMovieMeshTopology`, exact rebuild of the bend, and the three spine refusals.
 * @evidence contracts/testing.md#independent-expectations The vertical two-metre square carried two metres encloses 2 * 2 * 2 = 8 cubic metres, a closed-form prism volume; the refusal texts are the spine's documented diagnostics. Rebuild equality tests determinism, not independently expected bent geometry.
 * @evidence contracts/testing.md#distinguishing-cases Covers a turning path and a straight vertical one, an exact rebuild, and three malformed paths one property away from the vertical sweep; interpolation between stations, guides and the atlas are owned by the other sweep and loft tests.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry calls portable engine functions directly; it installs no consumer, builds no native artifact and starts no process, browser or GPU.
 */
export function test_geometry_procedural_sweep(): void {
  const small: IAutoMovieProfilePoint[] = square.map(
    (point: IAutoMovieProfilePoint): IAutoMovieProfilePoint => ({ x: point.x * 0.1, y: point.y * 0.1 }),
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
      ["bent", (): boolean => finiteMesh(swept) && swept.indices!.length > 0],
      ["vertical", (): boolean => finiteMesh(vertical) && vertical.indices!.length > 0],
      ["verticalVolume", (): boolean => nclose(inspectAutoMovieMeshTopology(vertical).volume, 2 * 2 * 2, 1e-12)],
    ]),
    { bent: true, vertical: true, verticalVolume: true },
  );

  TestValidator.predicate("bent sweep reproduces its authored geometry", equalGeometryTestValues(sweep(small, bend, up), swept));

  const invalids: Array<readonly [string, () => unknown, string]> = [
    ["sweep path", (): IAutoMovieMesh => sweep(square, [{ x: 0, y: 0, z: 0 }], up), "sweep spine needs at least two points"],
    [
      "sweep finite",
      (): IAutoMovieMesh =>
        sweep(
          square,
          [
            { x: 0, y: 0, z: 0 },
            { x: Number.NaN, y: 1, z: 0 },
          ],
          up,
        ),
      "sweep spine point 1 is not finite",
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
    TestValidator.predicate(`${name} is refused by its own diagnostic`, throwsError(callback, message));
}
