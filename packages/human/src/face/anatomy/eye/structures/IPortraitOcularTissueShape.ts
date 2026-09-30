/**
 * Visible conjunctival tissue and lower lid margin, in construction millimetres.
 * These are authored surface dimensions, not measurements of internal anatomy.
 * Zero length/width disables the corresponding surface independently.
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
