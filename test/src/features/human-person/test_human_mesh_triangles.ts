import { dropHumanMeshTriangles } from "@automovie/human";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * Dropping triangles compacts every attribute with the vertices.
 *
 * The mesh is a quad of vertices 0 (0,0,0), 1 (1,0,0), 2 (0,1,0) and 3
 * (1,1,0), split into the triangles (0,1,2) and (1,3,2), with a position,
 * normal, UV, colour and relief weight at each vertex, so each attribute
 * array is recognisable by which vertex it holds.
 *
 * Scenarios:
 * 1. Marking vertex 3 removes the triangle (1,3,2) and the vertex, and leaves
 *    the first triangle over vertices 0..2 with every attribute of vertex 3
 *    gone.
 * 2. Marking vertex 0 removes (0,1,2); the survivors 1, 2 and 3 become 0, 1
 *    and 2 in their original order, so the triangle (1,3,2) is (0,2,1), and
 *    each attribute array holds vertices 1..3.
 * 3. Marking nothing changes nothing but returns fresh arrays; marking a vertex
 *    of every triangle removes everything.
 * 4. A mesh without optional attributes stays without them, and the input is
 *    never modified.
 * 5. A mesh without an index list refuses.
 */
export const test_human_mesh_triangles = (): void => {
  const mesh = (): IAutoMovieMesh => ({
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0],
    normals: [0, 0, 1, 0, 0, 2, 0, 0, 3, 0, 0, 4],
    uvs: [0, 0, 1, 0, 0, 1, 1, 1],
    indices: [0, 1, 2, 1, 3, 2],
    skin: null,
    colors: [0.1, 0.1, 0.1, 0.2, 0.2, 0.2, 0.3, 0.3, 0.3, 0.4, 0.4, 0.4],
    reliefWeights: [1, 2, 3, 4],
  });
  const input = mesh();
  const withoutThree = dropHumanMeshTriangles(input, (vertex) => vertex === 3);
  TestValidator.equals("marking vertex 3 keeps the first triangle", withoutThree, {
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    normals: [0, 0, 1, 0, 0, 2, 0, 0, 3],
    uvs: [0, 0, 1, 0, 0, 1],
    indices: [0, 1, 2],
    skin: null,
    colors: [0.1, 0.1, 0.1, 0.2, 0.2, 0.2, 0.3, 0.3, 0.3],
    reliefWeights: [1, 2, 3],
  });
  TestValidator.equals("the input is not modified", input, mesh());

  const withoutZero = dropHumanMeshTriangles(mesh(), (vertex) => vertex === 0);
  TestValidator.equals("marking vertex 0 renumbers the survivors", withoutZero, {
    positions: [1, 0, 0, 0, 1, 0, 1, 1, 0],
    normals: [0, 0, 2, 0, 0, 3, 0, 0, 4],
    uvs: [1, 0, 0, 1, 1, 1],
    indices: [0, 2, 1],
    skin: null,
    colors: [0.2, 0.2, 0.2, 0.3, 0.3, 0.3, 0.4, 0.4, 0.4],
    reliefWeights: [2, 3, 4],
  });

  const untouched = dropHumanMeshTriangles(mesh(), () => false);
  TestValidator.equals("marking nothing keeps the mesh", untouched, mesh());
  TestValidator.equals(
    "marking a corner of every triangle removes everything",
    dropHumanMeshTriangles(mesh(), (vertex) => vertex === 1 || vertex === 2)
      .indices,
    [],
  );

  const bare: IAutoMovieMesh = {
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    normals: null,
    uvs: null,
    indices: [0, 1, 2],
    skin: null,
  };
  TestValidator.equals(
    "a mesh without optional attributes stays without them",
    dropHumanMeshTriangles(bare, () => false),
    bare,
  );
  TestValidator.predicate(
    "a mesh without indices refuses",
    throwsError(
      () => dropHumanMeshTriangles({ ...bare, indices: null }, () => false),
      "indexed mesh",
    ),
  );
};
