/**
 * Subject-level pinna placement and dimensions. Lengths are millimetres of the
 * head frame (+X anatomical left, +Y up, +Z anterior) and scales multiply the
 * authored outline independently of the host's shape.
 *
 * `resolvePortraitEarSampling` admits a shape: finite placement, positive
 * scales and projection, nonnegative embedding and integer tessellation inside
 * its budget. It does not encode the range of a living pinna.
 *
 * @evidence contracts/common.md#principled-implementation The type is the pinna's placement (two centres), its outline scales, the posterior projection and root embedding, and an optional tessellation independent of all of them; the domains the type cannot express (finite values, positive scales, integer counts in a budget) are enforced by resolvePortraitEarSampling.
 * @evidence contracts/common.md#clear-and-simple-design A flat record of what the pinna builder reads, with one optional tessellation record and no behaviour.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration carries no behaviour, special case or compensating path.
 * @evidence contracts/common.md#meaningful-documentation The comment and members state the frame, the unit, the direction of each placement, the domain of each scale and the tessellation budget, and that the admission does not encode a living range.
 * @evidence contracts/modeling.md#spatial-conventions Placement and projection are head-frame millimetres with +X anatomical left, +Y up and +Z anterior, as the pinna builder reads them, the scales are dimensionless and the tessellation counts carry no frame; the type converts nothing.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The type is a declaration and defines no part or group; the pinna builder that reads it is the part.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The type constructs no surface; the builder that reads it owns the rim shared with the host.
 * @evidenceExclude contracts/modeling.md#rendered-observation The type is a declaration and displays nothing; the pinna it configures is observed by its builder.
 *
 * @author Samchon
 */
export interface IPortraitEarShape {
  /** Vertical centre in the head frame, in mm. */
  centerY: number;

  /** Sagittal centre in the head frame, in mm. */
  centerZ: number;

  /** Positive vertical outline multiplier. */
  heightScale: number;

  /** Positive anterior/posterior outline multiplier. */
  depthScale: number;

  /** Positive posterior-rim projection beyond the sampled host surface, in mm. */
  projection: number;

  /** Nonnegative embedding depth at the anterior root, in mm. */
  embedding: number;

  /** Optional tessellation, independent of anatomical dimensions; omission uses 112 angular columns, 60 front rows and 40 back rows. */
  sampling?: {
    /** Angular columns in [8,512]. */
    columns: number;

    /** Radial anterior rows in [2,256]. */
    frontRows: number;

    /** Radial posterior rows in [2,256]. */
    backRows: number;
  };
}
