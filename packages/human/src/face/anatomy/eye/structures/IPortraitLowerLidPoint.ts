/**
 * A point in the lower lid's transverse section. Offset runs outward from the
 * aperture in its local image-plane normal; projection is signed anterior
 * relief over the common globe-to-skin depth bridge. Both use millimetres.
 * These describe visible tissue, not measured muscle thickness.
 *
 * @evidence contracts/common.md#principled-implementation An offset from the aperture along its planar outward normal and a signed anterior relief are the two coordinates of a point in a transverse section of the lid, which is all the lid-row construction needs of a tissue station.
 * @evidence contracts/common.md#clear-and-simple-design A two-field record shared by the six roles of a lower-lid section.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A type carries no mechanism and no field names a subject or fixture.
 * @evidence contracts/common.md#meaningful-documentation Each field states its sign, its unit and its reference, and the record says that it describes visible tissue and not a measured muscle thickness.
 * @evidence contracts/modeling.md#spatial-conventions Both fields are millimetres in the lid's section frame, offset along the planar outward normal and projection anterior, as the record and its fields state.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record is one station of a section and defines no part or group.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record owns no part and displays nothing.
 *
 * @author Samchon
 */
export interface IPortraitLowerLidPoint {
  /** Positive distance from the aperture, in millimetres. */
  offset: number;

  /** Signed anterior relief relative to the section's support bridge, in mm. */
  projection: number;
}
