/**
 * One fixed oriented support plane in the local XZ section.
 *
 * @evidence contracts/common.md#principled-implementation The inequality nx X + nz Z <= h(Y) uses this fixed outward normal.
 * @evidence contracts/common.md#clear-and-simple-design One named contract is shared by the authoring model and its existing consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This declaration supplies no geometry, inference, fallback or runtime behavior.
 * @evidence contracts/common.md#meaningful-documentation Defines registry uniqueness, normal components and dimensionless unit length.
 */
export interface IAutoMovieConvexSupportLoftPlane {
  /** Unique plane identity within the loft registry. */
  id: string;

  /** Dimensionless outward unit normal [nx,nz]. */
  normal: [number, number];
}
