import type { ConnectedBodyPart } from "@automovie/playground/src/human/body/ConnectedBodyPart";

/**
 * The numerical arrays a body or person resident keeps beside its group.
 *
 * @evidence contracts/common.md#principled-implementation Lists the mesh arrays each part actually holds.
 * @evidence contracts/common.md#meaningful-documentation States which arrays are counted.
 */
export function collectHumanViewerBodyArrays(
  parts: readonly ConnectedBodyPart[],
): (ArrayLike<number | null> | null | undefined)[] {
  return parts.flatMap((part) => {
    const mesh = part.geometry.mesh;
    return [mesh.positions, mesh.normals, mesh.indices, mesh.uvs, mesh.colors,
      mesh.physicalVertices?.vertices];
  });
}
