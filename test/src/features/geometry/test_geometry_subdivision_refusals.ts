import {
  type IAutoMovieSubdivisionCage,
  subdivideAutoMovieSurface,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/throwsError";

/** Two unit quads sharing the edge 1-4, with one UV per vertex. */
const VALID: IAutoMovieSubdivisionCage = {
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

const refuses: (
  cage: IAutoMovieSubdivisionCage,
  message: string,
  levels?: number,
) => boolean = (
  cage: IAutoMovieSubdivisionCage,
  message: string,
  levels: number = 1,
): boolean =>
  throwsError((): unknown => subdivideAutoMovieSurface({ cage, levels }), message);

/**
 * Pins every refusal of `subdivideAutoMovieSurface`, each one property away
 * from a cage that subdivides.
 *
 * Scenarios:
 *
 * 1. The valid two-quad cage with UVs and a semi-sharp crease subdivides, and
 *    sharpness 0 and 10 at the range ends are admitted.
 * 2. Levels: 0, a fraction and NaN are refused.
 * 3. Positions: empty, not packed in threes, and non-finite are refused.
 * 4. Faces: none, a two-corner face, an out-of-range or fractional corner, and
 *    a repeated vertex are refused.
 * 5. Manifold: an edge in three faces, two faces traversing an edge the same
 *    way, an unused vertex, and two fans meeting at one vertex are refused.
 * 6. Creases: an out-of-range end, equal ends, a sharpness below 0, above 10
 *    or NaN, a repeated edge in either direction, and a pair that is not a
 *    cage edge are refused.
 * 7. UVs: one array without the other, an odd or non-finite array, a row count
 *    or row length that differs from the faces, an out-of-range index, a UV
 *    shared by two vertices, and an unused UV are refused.
 * 8. A vanishing limit normal, at the valence-2 interior vertices of a cage
 *    made of one quad and its reverse, is refused after refinement.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `subdivideAutoMovieSurface` on each malformed cage and asserts a synchronous Error naming the defect; a guard that is missing, misplaced or silently repairs the input fails.
 * @evidence contracts/testing.md#independent-expectations Each refusal follows from the documented cage contract (manifold, consistent winding, vertex-owned UVs, sharpness range, integer level of at least one) and the expected message fragment names the offending index, not an implementation detail.
 * @evidence contracts/testing.md#distinguishing-cases Every negative case is one property away from the valid cage, and the valid cage plus both sharpness range ends prove the guards do not over-reach; rules, limits, boundaries, creases and UVs are owned by the other `test_geometry_subdivision_*` tests.
 * @evidence contracts/testing.md#execution-ownership A discoverable unit entry calling the portable engine function on synthetic cages; no consumer, native build, process, browser or GPU.
 */
export function test_geometry_subdivision_refusals(): void {
  TestValidator.predicate(
    "the valid cage and both sharpness ends subdivide",
    [VALID, { ...VALID, creases: [{ from: 4, to: 1, sharpness: 0 }] }, {
      ...VALID,
      creases: [{ from: 1, to: 4, sharpness: 10 }],
    }].every(
      (cage: IAutoMovieSubdivisionCage): boolean =>
        subdivideAutoMovieSurface({ cage, levels: 2 }).faces.length === 32 * 4,
    ),
  );
  TestValidator.predicate(
    "levels must be an integer of at least one",
    [0, 1.5, Number.NaN].every((levels: number): boolean =>
      refuses(VALID, "subdivision levels must be an integer of at least 1", levels),
    ),
  );
  TestValidator.predicate(
    "positions must be finite triples",
    refuses({ ...VALID, positions: [] }, "positions must hold x, y, z") &&
      refuses({ ...VALID, positions: VALID.positions.slice(1) }, "positions must hold x, y, z") &&
      refuses(
        { ...VALID, positions: [Number.POSITIVE_INFINITY, ...VALID.positions.slice(1)] },
        "positions[0] must be finite",
      ),
  );
  TestValidator.predicate(
    "faces must be polygons of distinct cage vertices",
    refuses({ ...VALID, faces: [], uvFaces: [] }, "needs at least one face") &&
      refuses({ ...VALID, faces: [[0, 1], [1, 2, 5, 4]] }, "face 0 needs at least three corners") &&
      refuses({ ...VALID, faces: [[0, 1, 9, 3], [1, 2, 5, 4]] }, "face 0 corner 2 must index a cage vertex") &&
      refuses({ ...VALID, faces: [[0, 1, 4.5, 3], [1, 2, 5, 4]] }, "face 0 corner 2 must index a cage vertex") &&
      refuses({ ...VALID, faces: [[0, 1, 4, 1], [1, 2, 5, 4]] }, "face 0 repeats vertex 1"),
  );
  const strip: IAutoMovieSubdivisionCage = {
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 2, 0, 0],
    faces: [
      [0, 1, 3, 2],
      [1, 4, 5, 3],
    ],
  };
  TestValidator.predicate(
    "the cage must be an oriented manifold with one fan per vertex",
    refuses(
      { ...strip, faces: [...strip.faces, [1, 3, 6]] },
      "edge 1-3 belongs to more than two faces",
    ) &&
      refuses(
        { ...strip, faces: [[0, 1, 3, 2], [3, 5, 4, 1]] },
        "faces 0 and 1 traverse edge 1-3 in the same direction",
      ) &&
      refuses(
        { ...strip, faces: [strip.faces[0]!] },
        "vertex 4 belongs to no face",
      ) &&
      refuses(
        {
          positions: [0, 0, 0, 1, 0, 0, 0, 1, 0, -1, 0, 0, 0, -1, 0],
          faces: [
            [0, 1, 2],
            [0, 3, 4],
          ],
        },
        "vertex 0 joins more than one fan of faces",
      ),
  );
  TestValidator.predicate(
    "creases must name cage edges with sharpness from 0 to 10",
    refuses({ ...VALID, creases: [{ from: 1, to: 9, sharpness: 1 }] }, "crease 0 must join two cage vertices") &&
      refuses({ ...VALID, creases: [{ from: 1, to: 1, sharpness: 1 }] }, "crease 0 must join two cage vertices") &&
      [-0.5, 10.5, Number.NaN].every((sharpness: number): boolean =>
        refuses({ ...VALID, creases: [{ from: 1, to: 4, sharpness }] }, "crease 0 sharpness must be from 0 to 10"),
      ) &&
      refuses(
        {
          ...VALID,
          creases: [
            { from: 1, to: 4, sharpness: 1 },
            { from: 4, to: 1, sharpness: 2 },
          ],
        },
        "crease 1 repeats edge 4-1",
      ) &&
      refuses({ ...VALID, creases: [{ from: 0, to: 4, sharpness: 1 }] }, "crease 0 names no cage edge 0-4"),
  );
  TestValidator.predicate(
    "UVs must be complete, finite, shaped like the faces and owned by one vertex",
    refuses({ ...VALID, uvFaces: undefined }, "uvs and uvFaces must be given together") &&
      refuses({ ...VALID, uvs: undefined }, "uvs and uvFaces must be given together") &&
      refuses({ ...VALID, uvs: VALID.uvs!.slice(1) }, "uvs must hold u, v pairs") &&
      refuses({ ...VALID, uvs: [Number.NaN, ...VALID.uvs!.slice(1)] }, "uvs[0] must be finite") &&
      refuses({ ...VALID, uvFaces: [VALID.uvFaces![0]!] }, "uvFaces must hold one row per face") &&
      refuses({ ...VALID, uvFaces: [[0, 1, 4], VALID.uvFaces![1]!] }, "uvFaces[0] must name one UV per corner") &&
      refuses({ ...VALID, uvFaces: [[0, 1, 4, 6], VALID.uvFaces![1]!] }, "uvFaces[0][3] must index a cage UV") &&
      refuses({ ...VALID, uvFaces: [[0, 1, 4, 0], VALID.uvFaces![1]!] }, "uv 0 is used by vertices 0 and 3") &&
      refuses({ ...VALID, uvs: [...VALID.uvs!, 0.25, 0.25] }, "uv 6 is used by no face corner"),
  );
  TestValidator.predicate(
    "a vanishing limit normal is refused",
    refuses(
      {
        positions: [0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0],
        faces: [
          [0, 1, 2, 3],
          [3, 2, 1, 0],
        ],
      },
      "limit normal at vertex",
    ),
  );
}
