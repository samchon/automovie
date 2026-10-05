import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";

/**
 * A face or body part placed in the person model: its id, name and material
 * under the owner's prefix, carrying the given mesh.
 *
 * Face and body parts share ids such as `skin`, so the person model names
 * every part and material after its owner (`face:skin`, `body:skin`).
 *
 * @evidence contracts/common.md#principled-implementation One naming rule for every part the person composes, so face and body ids never collide.
 * @evidence contracts/common.md#clear-and-simple-design A copy with three prefixed names and the given mesh.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The part is copied, never renamed in place.
 * @evidence contracts/common.md#meaningful-documentation States the naming rule and why it exists.
 * @evidence contracts/modeling.md#part-identity-and-grouping Keeps each composed part one named declaration under its owner group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The mesh is the caller's; the function only places it.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The function moves no value with a unit or frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
 */
export function prefixHumanPersonPart(
  owner: "face" | "body",
  part: IAutoMovieModel["parts"][number],
  mesh: IAutoMovieMesh,
): IAutoMovieModel["parts"][number] {
  return {
    ...part,
    id: owner + ":" + part.id,
    name: owner + ":" + part.name,
    material: owner + ":" + part.material,
    geometry: { type: "mesh", mesh },
  };
}
