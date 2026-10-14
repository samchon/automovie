import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";

/**
 * The mesh of a model part, refusing a part that is not one.
 *
 * The person assembler reads, moves and joins mesh geometry. A primitive names itself in the refusal before those consumers access mesh fields. The returned mesh is the original borrowed object; this selector validates its geometry variant only.
 *
 * @evidence contracts/common.md#principled-implementation The discriminated geometry variant selects an actual resident mesh and refuses a primitive before mesh-only composition.
 * @evidence contracts/common.md#clear-and-simple-design One accessor returns the existing mesh; geometry validity and physical identity stay with their admission owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported primitive input refuses without conversion or a replacement mesh; mesh topology is not certified by the variant check.
 * @evidence contracts/common.md#meaningful-documentation Prose states mesh-only selection, named failure and borrowed-object ownership.
 * @evidence contracts/performance.md#efficient-algorithms One discriminant check and property access use constant work independent of mesh size.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Accessing an existing mesh requires no result cache or shared request coordinator.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The selector allocates no mesh or retained handle; the original part owner controls mesh lifetime.
 */
export function meshOfHumanPart(
  part: IAutoMovieModel["parts"][number],
): IAutoMovieMesh {
  if (part.geometry.type !== "mesh")
    throw new Error("A human part is a mesh: " + part.id);
  return part.geometry.mesh;
}
