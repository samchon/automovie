/**
 * Owned mesh buffers crossing the shared preview and static-export precision boundary.
 * Positions preserve the input local metre frame; normals are dimensionless
 * directions in that frame and UV0 is dimensionless. The conversion owner refuses finite-value, orientation and
 * source-face loss before handing these new arrays to either consumer.
 *
 *
 * @evidence contracts/common.md#principled-implementation Owned Float32 local-metre positions, dimensionless normals/UV0 and Uint32 indices cross preview/static-export boundaries; null preserves absent attributes and the converter separately admits finite directions/source faces.
 * @evidence contracts/common.md#clear-and-simple-design Four transport fields expose exact buffer roles while float32MeshBuffers owns precision conversion and admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No anatomical or renderer certification is implied and absent attributes are not replaced by synthesized data.
 * @evidence contracts/common.md#meaningful-documentation Member comments give owned arrays, local position units, dimensionless UV0, null absence and triangle incidence.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This buffer shape executes no quantization/topology algorithm; the converter owns that work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No cache or mesh/reference equivalence is defined by the transport record.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Concrete arrays transfer to consumers; the declaration acquires no handles/tasks or independent persistent buffer store.
 *
 *
 * @author Samchon
 */
export interface IHumanFloat32MeshBuffers {
  /** Owned XYZ positions at Float32 precision, in local metres. */
  positions: Float32Array<ArrayBuffer>;

  /** Owned dimensionless Float32 normal components in the local frame; null preserves an absent input attribute. */
  normals: Float32Array<ArrayBuffer> | null;

  /** Owned Float32 UV0 coordinates; null preserves an absent input attribute. */
  uvs: Float32Array<ArrayBuffer> | null;

  /** Owned triangle incidence at the resident Uint32 index boundary. */
  indices: Uint32Array<ArrayBuffer>;
}
