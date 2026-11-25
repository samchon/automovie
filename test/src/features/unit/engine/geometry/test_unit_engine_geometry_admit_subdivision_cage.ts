import { admitSubdivisionCage } from "@automovie/engine";
import type {
  IAutoMovieSubdivisionCage,
  IAutoMovieSubdivisionLevel,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

/**
 * `admitSubdivisionCage(cage)` validates a cage and returns level zero: copied
 * positions, the topology, creases as edge sharpness, UVs, and each corner's
 * source parameter (a quad corner at its square corner, any other corner at (0,
 * 0) of its own sub-face).
 *
 * Fixture: quads [0, 1, 4, 3] and [1, 2, 5, 4] of the 3 x 2 unit grid; one UV
 * per vertex.
 *
 * Scenarios:
 *
 * 1. Positions are a copy; the faces are 0, 0, 0, 0, 1, 1, 1, 1 with corners -1
 *    and (u, v) (0,0), (1,0), (1,1), (0,1); UVs null without them.
 * 2. A triangle names its corners 0, 1, 2 at (0, 0).
 * 3. A crease 1-4 at 2 sets that edge's sharpness to 2; UVs and corner UVs come
 *    through.
 * 4. Each refusal: empty positions, no faces, a two-corner face, a corner out of
 *    range, a repeated vertex, a crease 0-0, sharpness 11, a repeated crease, a
 *    crease 0-2 on no edge, UVs without faces, odd UVs, a short UV row, a UV out
 *    of range, one UV on two vertices, an unused UV.
 */
export function test_unit_engine_geometry_admit_subdivision_cage(): void {
  const cage: IAutoMovieSubdivisionCage = {
    positions: [0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 1, 0, 1, 1, 0, 2, 1, 0],
    faces: [
      [0, 1, 4, 3],
      [1, 2, 5, 4],
    ],
  };
  const uvs: number[] = [0, 0, 0.5, 0, 1, 0, 0, 1, 0.5, 1, 1, 1];

  // 1.
  const level: IAutoMovieSubdivisionLevel = admitSubdivisionCage(cage);
  TestValidator.predicate("copy", level.positions !== cage.positions && level.positions.length === 18);
  TestValidator.equals("faces", level.parameterFaces, [0, 0, 0, 0, 1, 1, 1, 1]);
  TestValidator.equals("corners", level.parameterCorners, [-1, -1, -1, -1, -1, -1, -1, -1]);
  TestValidator.equals("u", level.parameterU, [0, 1, 1, 0, 0, 1, 1, 0]);
  TestValidator.equals("v", level.parameterV, [0, 0, 1, 1, 0, 0, 1, 1]);
  TestValidator.equals("no uvs", [level.uvs, level.cornerUvs, level.cage], [null, null, true]);

  // 2.
  const triangle: IAutoMovieSubdivisionLevel = admitSubdivisionCage({ positions: cage.positions.slice(0, 9), faces: [[0, 1, 2]] });
  TestValidator.equals("triangle", [triangle.parameterCorners, triangle.parameterU, triangle.parameterV], [[0, 1, 2], [0, 0, 0], [0, 0, 0]]);

  // 3.
  const creased: IAutoMovieSubdivisionLevel = admitSubdivisionCage({
    ...cage,
    creases: [{ from: 4, to: 1, sharpness: 2 }],
    uvs,
    uvFaces: cage.faces,
  });
  TestValidator.equals("crease", creased.topology.edgeSharpness[1], 2);
  TestValidator.equals("uvs", [creased.uvs, creased.cornerUvs], [uvs, cage.faces.flat()]);

  // 4.
  const p: string = "subdivision cage ";
  for (const [label, bad, message] of [
    ["empty", { ...cage, positions: [] }, "positions must hold x, y, z for at least one vertex"],
    ["no faces", { ...cage, faces: [] }, "needs at least one face"],
    ["two corners", { ...cage, faces: [[0, 1]] }, "face 0 needs at least three corners"],
    ["out of range", { ...cage, faces: [[0, 1, 6]] }, "face 0 corner 2 must index a cage vertex"],
    ["repeat", { ...cage, faces: [[0, 1, 1]] }, "face 0 repeats vertex 1"],
    ["crease 0-0", { ...cage, creases: [{ from: 0, to: 0, sharpness: 1 }] }, "crease 0 must join two cage vertices"],
    ["sharpness 11", { ...cage, creases: [{ from: 1, to: 4, sharpness: 11 }] }, "crease 0 sharpness must be from 0 to 10"],
    [
      "repeated crease",
      {
        ...cage,
        creases: [
          { from: 1, to: 4, sharpness: 1 },
          { from: 4, to: 1, sharpness: 2 },
        ],
      },
      "crease 1 repeats edge 4-1",
    ],
    ["no edge", { ...cage, creases: [{ from: 0, to: 2, sharpness: 1 }] }, "crease 0 names no cage edge 0-2"],
    ["uvs alone", { ...cage, uvs }, "uvs and uvFaces must be given together"],
    ["odd uvs", { ...cage, uvs: [0, 0, 1], uvFaces: cage.faces }, "uvs must hold u, v pairs"],
    ["short row", { ...cage, uvs, uvFaces: [[0, 1, 4], [1, 2, 5, 4]] }, "uvFaces[0] must name one UV per corner"],
    ["uv range", { ...cage, uvs, uvFaces: [[0, 1, 4, 6], [1, 2, 5, 4]] }, "uvFaces[0][3] must index a cage UV"],
    ["shared uv", { ...cage, uvs, uvFaces: [[0, 1, 4, 3], [1, 2, 5, 1]] }, "uv 1 is used by vertices 1 and 4"],
    ["unused uv", { ...cage, uvs: [...uvs, 9, 9], uvFaces: cage.faces }, "uv 6 is used by no face corner"],
  ] satisfies [string, IAutoMovieSubdivisionCage, string][])
    TestValidator.predicate(label, throwsError((): unknown => admitSubdivisionCage(bad), p + message));
}
