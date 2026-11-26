import { AutoMovieRecoveryShape } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `prepareRecoveryMeshIncidence` canonicalizes vertices by exact coordinate
 * when aliases are allowed, and lists each canonical edge's faces and each
 * canonical vertex's faces.
 *
 * Scenarios:
 *
 * 1. Vertex 3 repeats vertex 0, so with aliases the canon is (0, 1, 2, 0); the
 *    triangles (0, 1, 2) and (3, 2, 1) then share all three edges, each edge
 *    key lists both faces, and each vertex lists both faces.
 * 2. Without aliases the canon is the identity.
 */
export function test_recovery_internal_prepare_mesh_incidence(): void {
  const vertices: [number, number, number][] = [
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 0],
  ];
  const input = {
    exactCoordinateAliases: true,
    triangles: [
      [0, 1, 2],
      [3, 2, 1],
    ] satisfies [number, number, number][],
  };
  const aliased = AutoMovieRecoveryShape.prepareMeshIncidence(input, vertices);
  TestValidator.equals("the canon", [...aliased.canon], [0, 1, 2, 0]);
  TestValidator.equals(
    "every edge has both faces",
    [...aliased.faceEdges.entries()].map(
      ([key, faces]: [string, Set<number>]): [string, number[]] => [
        key,
        [...faces],
      ],
    ),
    [
      ["0,1", [0, 1]],
      ["1,2", [0, 1]],
      ["0,2", [0, 1]],
    ],
  );
  TestValidator.equals(
    "every vertex has both faces",
    [0, 1, 2].map((vertex: number): number[] => [
      ...aliased.vertexFaces.get(vertex)!,
    ]),
    [
      [0, 1],
      [0, 1],
      [0, 1],
    ],
  );
  const plain = AutoMovieRecoveryShape.prepareMeshIncidence(
    { ...input, exactCoordinateAliases: false },
    vertices,
  );
  TestValidator.equals("the identity canon", [...plain.canon], [0, 1, 2, 3]);
}
