/**
 * Subject-level pinna placement and dimensions. Lengths are millimetres of the
 * head frame (+X anatomical left, +Y up, +Z anterior) and scales multiply the
 * authored outline independently of the host's shape.
 *
 * `resolvePortraitEarSampling` admits a shape: finite placement, positive
 * scales and projection, nonnegative embedding and integer tessellation inside
 * its budget. It does not encode the range of a living pinna.
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
