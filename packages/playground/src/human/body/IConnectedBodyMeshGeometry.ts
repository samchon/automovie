import type { ConnectedBodyMesh } from "./connectedBodyProtocol";

/**
 * Static mesh geometry of one transferable body part.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Carries each committed body region's drawable mesh.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Keeps every preview part on prepared static Float32 geometry rather than a primitive the viewer must tessellate.
 * @author Samchon
 */
export interface IConnectedBodyMeshGeometry {
  /**
   * Geometry kind: always a prepared mesh.
   *
   * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Shows the body region as the mesh the worker prepared.
   * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Fixes the preview geometry kind to static mesh.
   */
  type: "mesh";

  /**
   * Prepared static mesh.
   *
   * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Carries the region's transferred buffers.
   * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Pairs the region's material binding with its Float32 buffers.
   */
  mesh: ConnectedBodyMesh;
}
