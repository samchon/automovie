import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";

/**
 * The mesh of a model part, refusing a part that is not one.
 *
 * The face and the body builders emit only mesh parts, and the person builder
 * reads, moves and joins meshes, so a part with a primitive shape is a broken
 * input and names itself in the refusal instead of failing later on a missing
 * field.
 */
export function meshOfHumanPart(
  part: IAutoMovieModel["parts"][number],
): IAutoMovieMesh {
  if (part.geometry.type !== "mesh")
    throw new Error("A human part is a mesh: " + part.id);
  return part.geometry.mesh;
}
