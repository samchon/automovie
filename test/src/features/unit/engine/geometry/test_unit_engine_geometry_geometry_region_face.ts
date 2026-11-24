import {
  buildAutoMovieRegionFace,
  inspectAutoMovieMeshTopology,
} from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieMeshTopology,
  IAutoMovieProfilePoint,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { equalGeometryTestValues } from "../../../internal/equalGeometryTestValues";
import { nclose } from "../../../internal/nclose";
import { namedFacts, throwsError } from "../../../internal/predicates";

/**
 * A region face is one oriented surface, not the two coincident sides emitted
 * by the legacy zero-height plane primitive. That identity is what lets an
 * author place separate interior and exterior material layers without adding a
 * camera-dependent optical shader.
 *
 * Scenarios:
 *
 * 1. A rectangle with a rectangular void becomes a positive-Z, open mesh whose
 *    positions and UVs retain the authored metre coordinates.
 * 2. Reversing both authored rings produces the identical canonical mesh, so
 *    input winding does not make an interior layer face the wrong way.
 * 3. A self-crossing boundary keeps the shared planar-region refusal rather
 *    than producing an ambiguous material surface.
 */
export function test_unit_engine_geometry_geometry_region_face(): void {
  const outer: readonly IAutoMovieProfilePoint[] = [
    { x: -2, y: -1 },
    { x: 2, y: -1 },
    { x: 2, y: 1 },
    { x: -2, y: 1 },
  ] as const;
  const hole: readonly IAutoMovieProfilePoint[] = [
    { x: -0.5, y: -0.25 },
    { x: 0.5, y: -0.25 },
    { x: 0.5, y: 0.25 },
    { x: -0.5, y: 0.25 },
  ] as const;
  const face: IAutoMovieMesh = buildAutoMovieRegionFace({
    outer,
    holes: [hole],
  });
  const topology: IAutoMovieMeshTopology = inspectAutoMovieMeshTopology(face);

  TestValidator.equals(
    "one canonical positive-Z face retains metric coordinates and its opening",
    namedFacts([
      ["vertex count", (): boolean => face.positions.length === 24],
      [
        "normal count",
        (): boolean => face.normals?.length === face.positions.length,
      ],
      [
        "positive Z",
        (): boolean =>
          face.normals?.every(
            (n: number, index: number): boolean =>
              index % 3 !== 2 || nclose(n, 1, 0),
          ) === true,
      ],
      [
        "zero X/Y normals",
        (): boolean =>
          face.normals?.every(
            (n: number, index: number): boolean =>
              index % 3 === 2 || nclose(n, 0, 0),
          ) === true,
      ],
      [
        "metric UVs",
        (): boolean =>
          face.uvs?.length === 16 &&
          face.uvs.every((value: number, index: number): boolean =>
            nclose(value, face.positions[(index >> 1) * 3 + (index % 2)], 0),
          ) === true,
      ],
      [
        "open boundary",
        (): boolean =>
          topology.watertight === false && topology.boundaryEdges === 8,
      ],
      ["not degenerate", (): boolean => topology.degenerate === 0],
      [
        "counter-clockwise triangles",
        (): boolean =>
          (face.indices ?? []).every(
            (_: number, index: number, indices: number[]): boolean => {
              if (index % 3 !== 0) return true;
              const a: number = indices[index]! * 3;
              const b: number = indices[index + 1]! * 3;
              const c: number = indices[index + 2]! * 3;
              const abx: number = face.positions[b]! - face.positions[a]!;
              const aby: number =
                face.positions[b + 1]! - face.positions[a + 1]!;
              const acx: number = face.positions[c]! - face.positions[a]!;
              const acy: number =
                face.positions[c + 1]! - face.positions[a + 1]!;
              return abx * acy - aby * acx > 0;
            },
          ),
      ],
      ["one side only", (): boolean => face.indices?.length === 24],
    ]),
    {
      "vertex count": true,
      "normal count": true,
      "positive Z": true,
      "zero X/Y normals": true,
      "metric UVs": true,
      "open boundary": true,
      "not degenerate": true,
      "counter-clockwise triangles": true,
      "one side only": true,
    },
  );

  TestValidator.predicate(
    "authored winding cannot reverse the material-facing side",
    equalGeometryTestValues(
      buildAutoMovieRegionFace({
        outer: [...outer].reverse(),
        holes: [[...hole].reverse()],
      }),
      face,
    ),
  );

  TestValidator.predicate(
    "an ambiguous boundary is refused before it becomes a surface",
    throwsError(
      (): IAutoMovieMesh =>
        buildAutoMovieRegionFace({
          outer: [
            { x: 0, y: 0 },
            { x: 4, y: 4 },
            { x: 4, y: 0 },
            { x: 0, y: 3 },
          ],
        }),
      "crosses itself",
    ),
  );
}
