import { buildSubdivisionTopology } from "@automovie/engine";
import type { IAutoMovieSubdivisionTopology } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

/**
 * `buildSubdivisionTopology(vertexCount, faceOffsets, faceVertices,
 * sharpnessOf)` numbers edges by first appearance, walks each vertex fan from a
 * boundary corner, sets boundary edges to sharpness 10, and refuses anything
 * that is not an oriented manifold.
 *
 * Fixture: two quads [0, 1, 4, 3] and [1, 2, 5, 4] of the 3 x 2 vertex grid,
 * interior sharpness 0.5.
 *
 * Scenarios:
 *
 * 1. Edges 0-1, 1-4, 4-3, 3-0, 1-2, 2-5, 5-4, the shared 1-4 used by corners 1 and
 *    7 at sharpness 0.5, the rest at 10; corner edges [0, 1, 2, 3, 4, 5, 6,
 *    1].
 * 2. Vertex 0's fan is corner 0 with edges [0, 3]; vertex 1's starts at the
 *    boundary corner 4 and turns to corner 1, with edges [4, 1, 0].
 * 3. A third face on edge 0-1 ("more than two faces"), two faces running 0-1 the
 *    same way ("traverse edge 0-1 in the same direction"), an unused vertex 3
 *    ("belongs to no face") and two triangles meeting only at vertex 0 ("joins
 *    more than one fan") are refused.
 */
export function test_unit_engine_geometry_subdivision_topology(): void {
  const rows = (faces: number[][]): [number[], number[]] => {
    const offsets: number[] = [0];
    for (const face of faces)
      offsets.push(offsets[offsets.length - 1]! + face.length);
    return [offsets, faces.flat()];
  };
  const build = (
    count: number,
    faces: number[][],
  ): IAutoMovieSubdivisionTopology => {
    const [offsets, vertices] = rows(faces);
    return buildSubdivisionTopology(
      count,
      offsets,
      vertices,
      (): number => 0.5,
    );
  };
  const t: IAutoMovieSubdivisionTopology = build(6, [
    [0, 1, 4, 3],
    [1, 2, 5, 4],
  ]);

  // 1.
  TestValidator.equals(
    "edges",
    t.edgeVertices,
    [0, 1, 1, 4, 4, 3, 3, 0, 1, 2, 2, 5, 5, 4],
  );
  TestValidator.equals(
    "edge corners",
    t.edgeCorners,
    [0, -1, 1, 7, 2, -1, 3, -1, 4, -1, 5, -1, 6, -1],
  );
  TestValidator.equals(
    "sharpness",
    t.edgeSharpness,
    [10, 0.5, 10, 10, 10, 10, 10],
  );
  TestValidator.equals("corner edges", t.cornerEdges, [0, 1, 2, 3, 4, 5, 6, 1]);
  TestValidator.equals("corner faces", t.cornerFaces, [0, 0, 0, 0, 1, 1, 1, 1]);

  // 2.
  TestValidator.equals("fan corners", t.fanCorners.slice(0, 3), [0, 4, 1]);
  TestValidator.equals(
    "fan corner offsets",
    t.fanCornerOffsets.slice(0, 3),
    [0, 1, 3],
  );
  TestValidator.equals("fan edges", t.fanEdges.slice(0, 5), [0, 3, 4, 1, 0]);
  TestValidator.equals(
    "fan edge offsets",
    t.fanEdgeOffsets.slice(0, 3),
    [0, 2, 5],
  );

  // 3.
  for (const [label, count, faces, message] of [
    [
      "three faces",
      5,
      [
        [0, 1, 2],
        [1, 0, 3],
        [0, 1, 4],
      ],
      "edge 0-1 belongs to more than two faces",
    ],
    [
      "same direction",
      4,
      [
        [0, 1, 2],
        [0, 1, 3],
      ],
      "faces 0 and 1 traverse edge 0-1 in the same direction",
    ],
    ["unused", 4, [[0, 1, 2]], "vertex 3 belongs to no face"],
    [
      "bowtie",
      5,
      [
        [0, 1, 2],
        [0, 3, 4],
      ],
      "vertex 0 joins more than one fan of faces",
    ],
  ] satisfies [string, number, number[][], string][])
    TestValidator.predicate(
      label,
      throwsError((): unknown => build(count, faces), message),
    );
}
