/**
 * Owned mesh buffers crossing the shared preview and static-export precision boundary.
 * Positions and normals preserve the input local metre frame; UV0 remains
 * dimensionless. The conversion owner refuses finite-value, orientation and
 * source-face loss before handing these new arrays to either consumer.
 *
 * @author Samchon
 */
export interface IHumanFloat32MeshBuffers {
  /** Owned XYZ positions at Float32 precision, in local metres. */
  positions: Float32Array<ArrayBuffer>;

  /** Owned Float32 normal components; null preserves an absent input attribute. */
  normals: Float32Array<ArrayBuffer> | null;

  /** Owned Float32 UV0 coordinates; null preserves an absent input attribute. */
  uvs: Float32Array<ArrayBuffer> | null;

  /** Owned triangle incidence at the resident Uint32 index boundary. */
  indices: Uint32Array<ArrayBuffer>;
}
