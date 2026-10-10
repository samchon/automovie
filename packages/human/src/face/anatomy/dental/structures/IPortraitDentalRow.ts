import { IPortraitDentalCrown } from "./IPortraitDentalCrown";

/**
 * One upper dental arch in a local millimetre frame. Individual crown profiles
 * describe enamel only; this group owns their spacing, curve and gingival plane.
 * +X runs across the arch, +Y towards the gingiva, +Z towards the lip. The arch's
 * anterior midpoint is the origin. These are authored portrait dimensions, not
 * a dental scan or a claim of physiological reconstruction.
 *
 * @author Samchon
 */
export interface IPortraitDentalRow {
  /** Positive transverse semiaxis of the arch, in mm. */
  halfWidth: number;

  /** Positive anterior-to-posterior arch semiaxis, in mm. */
  depth: number;

  /** Nonnegative clearance measured along the common arch, in millimetres. */
  gap: number;

  /**
   * Minimum inter-crown surface gap along local X, in mm, finite and nonnegative.
   * Omission is zero: neighbouring crowns touch at most and never interpenetrate,
   * because the row always shifts intact crowns along X until their complete
   * proximal surfaces clear.
   */
  contactGap?: number;

  /** Ordered from anatomical right to left; each crown keeps its own dimensions. */
  crowns: readonly IPortraitDentalCrown[];
}
