import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

/**
 * An axis-aligned box as one closed outward mesh: eight shared corners and
 * twelve triangles, counter-clockwise seen from outside.
 *
 * Corner `i` takes the maximum on X when bit 0 of `i` is set, on Y for bit 1
 * and on Z for bit 2. Faces follow the order -X, +X, -Y, +Y, -Z, +Z, two
 * triangles each, so the last two triangles are the top face. Each face is
 * split along the diagonal from its first listed corner. Coordinates are
 * metres; the mesh carries no normals, UVs or skin.
 *
 * @param min The box's least corner.
 * @param max The box's greatest corner.
 * @returns A fresh mesh the caller owns.
 */
export const outwardBoxMesh: (
  min: IAutoMovieVector3,
  max: IAutoMovieVector3,
) => IAutoMovieMesh = (
  min: IAutoMovieVector3,
  max: IAutoMovieVector3,
): IAutoMovieMesh => {
  const positions: number[] = [];
  for (let corner: number = 0; corner < 8; ++corner)
    positions.push(
      corner & 1 ? max.x : min.x,
      corner & 2 ? max.y : min.y,
      corner & 4 ? max.z : min.z,
    );
  const indices: number[] = [];
  for (const [a, b, c, d] of BOX_QUADS) indices.push(a!, b!, c!, a!, c!, d!);
  return { positions, normals: null, uvs: null, indices, skin: null };
};

/**
 * Each face's corners, counter-clockwise seen from outside, in -X, +X, -Y, +Y,
 * -Z, +Z order.
 */
const BOX_QUADS: readonly (readonly number[])[] = [
  [0, 4, 6, 2],
  [1, 3, 7, 5],
  [0, 1, 5, 4],
  [2, 6, 7, 3],
  [0, 2, 3, 1],
  [4, 5, 7, 6],
];
