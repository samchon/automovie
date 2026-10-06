/**
 * The body editor's worker transports Float32 preview buffers independently of
 * GLB export. The worker owns the compiled basis and source model; transferred
 * arrays belong to one reply and the page may retain only the displayed frame.
 */
import type { ConnectedBodyResult } from "./ConnectedBodyResult";

/** Transfer exactly the buffers owned by this reply, never basis memory.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Delivers preview geometry without copying the compiled basis.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-export Delivers requested GLB bytes without encoding during preview.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Transfers each preview's numerical buffers to its transaction.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-export Transfers only the explicit export's binary file.
 */
export function connectedBodyTransfers(
  result: ConnectedBodyResult,
): ArrayBuffer[] {
  if (result.operation === "export" || result.operation === "exportConstruction") return [result.glb.buffer];
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
