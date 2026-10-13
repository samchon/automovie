/**
 * The body editor's worker transports Float32 preview buffers independently of GLB export. The worker owns the compiled basis and source model; transferred arrays belong to one reply and the page may retain only the displayed frame.
 */
import type { ConnectedBodyResult } from "@automovie/human/body/runtime/ConnectedBodyResult";

/**
 * List reply-owned mesh or export buffers for the worker's postMessage transfer. The numerical preview packer creates independent attribute arrays, so these are neither basis buffers nor repeated shared-buffer views. Listing does not itself detach anything; the worker owns the subsequent transfer.
 *
 * @evidence contracts/common.md#principled-implementation Export results contribute their GLB buffer, arms-down results contribute none, and mesh results contribute the independently owned arrays produced by the numerical preview packer.
 * @evidence contracts/common.md#clear-and-simple-design A single operation-discriminated transfer list serves body and person worker replies without duplicating mesh packing or postMessage transport.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The list takes actual packed reply buffers rather than compiled basis memory or fixture byte ranges; unique attribute ownership is a premise of the numerical packer it consumes.
 * @evidence contracts/common.md#meaningful-documentation The comment records reply ownership, independent-buffer provenance and the distinction between listing and native transfer detachment.
 * @evidence contracts/performance.md#efficient-algorithms A single scan of p model parts adds at most five attribute references per part in O(p) time and space without copying their numerical bytes; export and pose-only replies use constant work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This transfer-list value operation caches no result and does not share effectful transfers between replies.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only a call-local reference array is allocated; buffer ownership and detachment belong to the numerical reply and worker postMessage caller.
 */
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
    const mesh: typeof part.geometry.mesh = part.geometry.mesh;
    buffers.push(mesh.positions.buffer, mesh.indices.buffer);
    if (mesh.normals !== null) buffers.push(mesh.normals.buffer);
    if (mesh.uvs !== null) buffers.push(mesh.uvs.buffer);
    if (mesh.colors !== undefined) buffers.push(mesh.colors.buffer);
  }
  return buffers;
}
