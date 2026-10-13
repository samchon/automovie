import type { ConnectedBodyPart } from "@automovie/human/body/runtime/ConnectedBodyPart";

/** The numerical arrays a body or person resident keeps beside its group. */
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
