/**
 * Visible conjunctival tissue and lower lid margin, in construction millimetres. These are authored surface dimensions, not measurements of internal anatomy. Zero length/width disables the corresponding surface independently.
 *
 * @evidence contracts/common.md#principled-implementation Five authored nonnegative surface dimensions describe visible caruncle, plica and wet-margin relief, without asserting population-derived internal anatomy.
 * @evidence contracts/common.md#clear-and-simple-design One shape record keeps the independently disabled medial patch and lower strip with their own longitudinal extent and relief controls.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero extent is a declared way to disable a tissue surface; no hidden minimum or consumer-specific substitute appears in the schema.
 * @evidence contracts/common.md#meaningful-documentation Each member documents its millimetre quantity and direction, and the declaration distinguishes authored dimensions from internal measurements.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The dimension record runs no geometry algorithm; dimension validation and lattice allocation are responsibilities of createPortraitOcularTissues.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work There is no memoized ocular shape result in these five inputs; the builder copies the dimensions before repeated boundary evaluations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only scalar authored dimensions are retained by an owning document; this record acquires neither buffers nor rendering resources itself.
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
