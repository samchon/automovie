import { moveHumanMeshRigidly } from "@automovie/human";
import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A mesh moved rigidly changes positions and normals and nothing else.
 *
 * The transform here is a shift of (1, 2, 3) for points and a swap of X and Z
 * for directions, so each expected value is hand-derived and the two
 * callbacks are told apart.
 *
 * Scenarios:
 * 1. Positions are shifted, normals are swapped, indices, UVs and colours are
 *    carried as they were, and the input is not modified.
 * 2. A mesh without normals stays without them.
 */
export const test_human_mesh_rigid = (): void => {
  const transform = {
    point: (p: IAutoMovieVector3): IAutoMovieVector3 => ({
      x: p.x + 1,
      y: p.y + 2,
      z: p.z + 3,
    }),
    direction: (n: IAutoMovieVector3): IAutoMovieVector3 => ({
      x: n.z,
      y: n.y,
      z: n.x,
    }),
  };
  const mesh = (): IAutoMovieMesh => ({
    positions: [0, 0, 0, 1, 0, 0],
    normals: [1, 0, 0, 0, 0, 1],
    uvs: [0, 0, 1, 0],
    indices: [0, 1, 0],
    skin: null,
    colors: [0.5, 0.5, 0.5, 1, 1, 1],
  });
  const input = mesh();
  TestValidator.equals(
    "positions shift, normals swap, the rest is carried",
    moveHumanMeshRigidly(input, transform),
    {
      positions: [1, 2, 3, 2, 2, 3],
      normals: [0, 0, 1, 1, 0, 0],
      uvs: [0, 0, 1, 0],
      indices: [0, 1, 0],
      skin: null,
      colors: [0.5, 0.5, 0.5, 1, 1, 1],
    },
  );
  TestValidator.equals("the input is not modified", input, mesh());
  TestValidator.equals(
    "a mesh without normals stays without them",
    moveHumanMeshRigidly({ ...mesh(), normals: null }, transform).normals,
    null,
  );
};
