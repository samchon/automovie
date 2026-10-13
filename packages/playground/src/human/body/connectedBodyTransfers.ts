/**
 * The body editor's worker transports Float32 preview buffers independently of
 * GLB export. The worker owns the compiled basis and source model; transferred
 * arrays belong to one reply and the page may retain only the displayed frame.
 */
import type { ConnectedBodyResult } from "@automovie/human/body/runtime/ConnectedBodyResult";

/** Transfer exactly the buffers owned by this reply, never basis memory. */
export function connectedBodyTransfers(
  result: ConnectedBodyResult,
): ArrayBuffer[] {
  if (
    result.operation === "export" ||
    result.operation === "exportConstruction"
  )
    return [result.glb.buffer];
  if (result.operation === "armsDown") return [];
  const buffers: ArrayBuffer[] = [];
  for (const part of result.model.parts) {
    const mesh = part.geometry.mesh;
    buffers.push(mesh.positions.buffer, mesh.indices.buffer);
    if (mesh.normals !== null) buffers.push(mesh.normals.buffer);
    if (mesh.uvs !== null) buffers.push(mesh.uvs.buffer);
    if (mesh.colors !== undefined) buffers.push(mesh.colors.buffer);
  }
  return buffers;
}
