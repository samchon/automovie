/**
 * Visible conjunctival tissue and lower lid margin, in construction millimetres.
 * These are authored surface dimensions, not measurements of internal anatomy.
 * Zero length/width disables the corresponding surface independently.
 *
 * @evidence contracts/common.md#principled-implementation Five nonnegative lengths, the medial tissue extent, its two reliefs and the lower margin's width and lift, are the whole input of the tissue builders, and a zero length or width removes its surface by itself.
 * @evidence contracts/common.md#clear-and-simple-design A flat record of five lengths read by one builder.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A type carries no mechanism and no field names a subject or fixture.
 * @evidence contracts/common.md#meaningful-documentation Each field states its unit and meaning, and the record says these are authored surface dimensions and not measurements of internal anatomy and what zero does.
 * @evidence contracts/modeling.md#spatial-conventions Every field is a millimetre length in the head construction frame, as each field states.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record parameterizes two tissue surfaces and defines no part or group.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no surface.
 *
 * @author Samchon
 */
export interface IPortraitOcularTissueShape {
  /** Medial tissue's extent from the inner canthus towards the iris, in mm. */
  cornerLength: number;

  /** Caruncular mound's maximum additional forward relief, in mm. */
  caruncleProjection: number;

  /** Plica ridge's additional relief lateral to the caruncle, in mm. */
  plicaProjection: number;

  /** Lower margin's maximum extent inside the visible opening, in mm. */
  lowerMarginWidth: number;

  /** Lower margin's additional rounded forward relief, in mm. */
  lowerMarginLift: number;
}
