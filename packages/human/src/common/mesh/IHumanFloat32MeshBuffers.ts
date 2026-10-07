

/**
 * Owned mesh buffers crossing the shared preview and static-export precision boundary.
 * Positions and normals preserve the input local metre frame; UV0 remains
 * dimensionless. The conversion owner refuses finite-value, orientation and
 * source-face loss before handing these new arrays to either consumer.
 *
 * @evidence contracts/common.md#principled-implementation Carries the same owned quantized arrays whose conversion and face-identity guards the precision owner checked.
 * @evidence contracts/common.md#clear-and-simple-design One result keeps vertex attributes and triangle incidence together at their common precision boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No regenerated topology or stored triangle count substitutes for the converted arrays.
 * @evidence contracts/common.md#meaningful-documentation States ownership, precision, optional attributes and the unchanged coordinate frame.
 * @evidence contracts/modeling.md#spatial-conventions Coordinates retain the input local metre frame, normals retain its directions and UV0 is dimensionless.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The result defines no anatomical part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The result defines no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The conversion owner preserves the supplied face population; this carrier chooses none.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The geometry owners define joins; this carrier carries their buffers.
 * @evidenceExclude contracts/modeling.md#rendered-observation Preview and export consumers own observed output; the carrier displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical representation establishes no anatomical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range The precision owner admits numerical representation, not physiological capacity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No new personal geometry input is introduced by this output record.
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
