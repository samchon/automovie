
/**
 * Subject-level pinna placement and dimensions. Lengths are millimetres and
 * scales multiply the authored outline independently of the host's shape.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Separates pinna placement, anatomical scale, projection and embedded root dimensions.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Defines head-frame millimetre placement with independent bounded angular/front/back sampling controls.
 */
export interface IPortraitEarShape {
  /** Vertical centre in the head frame. */
  centerY: number;
  /** Sagittal centre in the head frame. */
  centerZ: number;
  /** Positive vertical outline multiplier. */
  heightScale: number;
  /** Positive anterior/posterior outline multiplier. */
  depthScale: number;
  /** Positive posterior-rim projection beyond the sampled host surface. */
  projection: number;
  /** Nonnegative embedding depth at the anterior root. */
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