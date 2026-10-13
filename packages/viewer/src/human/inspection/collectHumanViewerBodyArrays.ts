import type { ConnectedBodyPart } from "@automovie/human/body/runtime/ConnectedBodyPart";

/**
 * The numerical arrays a body or person resident keeps beside its group.
 *
 * @evidence contracts/common.md#principled-implementation Lists the mesh arrays each part actually holds.
 * @evidence contracts/common.md#meaningful-documentation States which arrays are counted.
 * @evidence contracts/common.md#clear-and-simple-design One projection lists the retained mesh array fields for the resident byte counter without duplicating the byte formula.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads actual part geometry arrays and optional physical correspondence; it supplies no document-name cost estimate or fixture byte count.
 */
export function collectHumanViewerBodyArrays(
  parts: readonly ConnectedBodyPart[],
): (ArrayLike<number | null> | null | undefined)[] {
  return parts.flatMap((part) => {
    const mesh = part.geometry.mesh;
    return [
      mesh.positions,
      mesh.normals,
      mesh.indices,
      mesh.uvs,
      mesh.colors,
      mesh.physicalVertices?.vertices,
    ];
  });
}
