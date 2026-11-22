import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";

/**
 * Close {@link createSkinnedTubeModel}'s open tube with a fan at each end, so
 * it bounds a solid as an ordinary limb mesh does. The bottom centre follows
 * `hips` and the top centre follows `spine`, like the end rings they join.
 *
 * @param model The skinned tube model; its mesh is extended in place.
 * @returns The same model.
 */
export function capSkinnedTubeModel(model: IAutoMovieModel): IAutoMovieModel {
  const geometry: IAutoMovieModel["parts"][number]["geometry"] =
    model.parts[0]!.geometry;
  if (geometry.type !== "mesh" || geometry.mesh.indices === null)
    throw new Error("The skinned tube fixture needs its indexed mesh");
  const mesh: IAutoMovieMesh = geometry.mesh;
  const sides: number = 16;
  const last: number = mesh.positions.length / 3 - sides;
  const bottom: number = mesh.positions.length / 3;
  mesh.positions.push(0, 0, 0, 0, 2, 0);
  mesh.normals?.push(0, -1, 0, 0, 1, 0);
  mesh.skin!.boneIndices.push(0, 1, 0, 0, 0, 1, 0, 0);
  mesh.skin!.weights.push(1, 0, 0, 0, 0, 1, 0, 0);
  for (let side: number = 0; side < sides; ++side) {
    const next: number = (side + 1) % sides;
    mesh.indices!.push(bottom, side, next);
    mesh.indices!.push(bottom + 1, last + next, last + side);
  }
  return model;
}
