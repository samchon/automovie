import type { ConnectedBodyMesh } from "./ConnectedBodyMesh";

/**
 * Static mesh geometry of one transferable body part.
 * packConnectedBodyModel supplies owned Float32 attributes and Uint32 incidence after its precision/topology checks. Source physical correspondence stays structured integer data rather than GPU attributes; metre coordinates remain part-local and the producer requires an unattached static model.
 *
 * @evidence contracts/common.md#principled-implementation A mesh discriminator wraps the connected mesh buffers admitted by the shared Float32 and topology boundaries.
 * @evidence contracts/common.md#clear-and-simple-design Geometry dispatch is separate from the ConnectedBodyMesh buffer schema and the part's material and identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Packing does not turn rounding into clinical validation or narrow physical source IDs to Float32.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies static ownership, attribute precision, source correspondence and local metre coordinates.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This wrapper type executes no mesh conversion.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The geometry schema owns no packed-buffer cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Actual buffer creation and transfer occur in the packer and worker transport, not this type.
 *
 * @author Samchon
 */
export interface IConnectedBodyMeshGeometry {
  /** Static resident mesh rather than procedural or skinned geometry. */
  type: "mesh";

  /** Owned transfer buffers and any copied physical correspondence. */
  mesh: ConnectedBodyMesh;
}
