import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";

/**
 * The mesh of a model part, refusing a part that is not one.
 *
 * The face and the body builders emit only mesh parts, and the person builder
 * reads, moves and joins meshes, so a part with a primitive shape is a broken
 * input and names itself in the refusal instead of failing later on a missing
 * field.
 *
 * @evidence contracts/common.md#principled-implementation The geometry union is discriminated by its `type`, so testing it is exactly the condition under which `mesh` exists.
 * @evidence contracts/common.md#clear-and-simple-design One test and one refusal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing is coerced; a non-mesh part refuses by id.
 * @evidence contracts/common.md#meaningful-documentation The comment states why only meshes are expected and what the refusal names.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function reads a part's mesh and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The function carries no unit or frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function defines no input a caller shapes a human form with.
 */
export function meshOfHumanPart(
  part: IAutoMovieModel["parts"][number],
): IAutoMovieMesh {
  if (part.geometry.type !== "mesh")
    throw new Error("A human part is a mesh: " + part.id);
  return part.geometry.mesh;
}
