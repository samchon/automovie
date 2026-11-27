import { AutoMovieEngineGeometry } from "@automovie/engine";
import type { IAutoMovieSubdivisionCage } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * `subdivideSurface` refuses every cage it cannot subdivide, each one
 * property away from a cage that subdivides.
 *
 * Fixture: two unit quads sharing the edge 1-4, one UV per vertex, a crease 1-4
 * of sharpness 2.5.
 *
 * Scenarios:
 *
 * 1. The cage, and its crease at sharpness 0 (reversed) and 10, subdivide twice
 *    to 32 quads.
 * 2. Six levels, the cap, turn one quad into 4^6.
 * 3. No face, a two-corner face, a corner indexing vertex 9 and a repeated vertex
 *    are refused by their own diagnostics.
 * 4. An edge in three faces, two faces traversing an edge the same way, an unused
 *    vertex and two fans meeting at one vertex are refused.
 * 5. One quad and its reverse vanish their limit normals ("limit normal at
 *    vertex").
 */
export function test_engine_geometry_subdivision_refusals(): void {
  const valid: IAutoMovieSubdivisionCage = {
    positions: [0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 1, 0, 1, 1, 0, 2, 1, 0],
    faces: [
      [0, 1, 4, 3],
      [1, 2, 5, 4],
    ],
    uvs: [0, 0, 0.5, 0, 1, 0, 0, 1, 0.5, 1, 1, 1],
    uvFaces: [
      [0, 1, 4, 3],
      [1, 2, 5, 4],
    ],
    creases: [{ from: 1, to: 4, sharpness: 2.5 }],
  };
  const refused = (label: string, cage: IAutoMovieSubdivisionCage, message: string): void =>
    TestValidator.predicate(label, throwsError((): unknown => AutoMovieEngineGeometry.subdivideSurface({ cage, levels: 1 }), message));
  const quad: number[] = [0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0];

  // 1.
  for (const cage of [
    valid,
    { ...valid, creases: [{ from: 4, to: 1, sharpness: 0 }] },
    { ...valid, creases: [{ from: 1, to: 4, sharpness: 10 }] },
  ])
    TestValidator.equals("subdivides", AutoMovieEngineGeometry.subdivideSurface({ cage, levels: 2 }).faces.length, 32 * 4);

  // 2.
  TestValidator.equals(
    "six levels",
    AutoMovieEngineGeometry.subdivideSurface({ cage: { positions: quad, faces: [[0, 1, 2, 3]] }, levels: 6 }).faces.length,
    4 ** 6 * 4,
  );

  // 3.
  refused("no face", { ...valid, faces: [], uvFaces: [] }, "needs at least one face");
  refused("two corners", { ...valid, faces: [[0, 1], valid.faces[1]!] }, "face 0 needs at least three corners");
  refused("vertex 9", { ...valid, faces: [[0, 1, 9, 3], valid.faces[1]!] }, "face 0 corner 2 must index a cage vertex");
  refused("repeated", { ...valid, faces: [[0, 1, 4, 1], valid.faces[1]!] }, "face 0 repeats vertex 1");

  // 4.
  const strip: IAutoMovieSubdivisionCage = {
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 2, 0, 0],
    faces: [
      [0, 1, 3, 2],
      [1, 4, 5, 3],
    ],
  };
  refused("three faces", { ...strip, faces: [...strip.faces, [1, 3, 6]] }, "edge 1-3 belongs to more than two faces");
  refused(
    "same direction",
    {
      ...strip,
      faces: [
        [0, 1, 3, 2],
        [3, 5, 4, 1],
      ],
    },
    "faces 0 and 1 traverse edge 1-3 in the same direction",
  );
  refused("unused vertex", { ...strip, faces: [strip.faces[0]!] }, "vertex 4 belongs to no face");
  refused(
    "two fans",
    {
      positions: [0, 0, 0, 1, 0, 0, 0, 1, 0, -1, 0, 0, 0, -1, 0],
      faces: [
        [0, 1, 2],
        [0, 3, 4],
      ],
    },
    "vertex 0 joins more than one fan of faces",
  );

  // 5.
  refused(
    "vanishing normal",
    {
      positions: quad,
      faces: [
        [0, 1, 2, 3],
        [3, 2, 1, 0],
      ],
    },
    "limit normal at vertex",
  );
}
