import type { ConnectedBodyMesh } from "./ConnectedBodyMesh";

/**
 * Static mesh geometry of one transferable body part.
 *
 * @author Samchon
 */
export interface IConnectedBodyMeshGeometry {
  /**
   * Geometry kind: always a prepared mesh.
   *
   */
  type: "mesh";

  /**
   * Prepared static mesh.
   *
   */
  mesh: ConnectedBodyMesh;
}
