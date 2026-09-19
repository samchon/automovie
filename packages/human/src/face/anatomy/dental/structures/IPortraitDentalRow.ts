import { IPortraitDentalCrown } from "./IPortraitDentalCrown";

/**
 * One upper dental arch in a local millimetre frame. Individual crown profiles
 * describe enamel only; this group owns their spacing, curve and gingival plane.
 * +X runs across the arch, +Y towards the gingiva, +Z towards the lip. The arch's
 * anterior midpoint is the origin. These are authored portrait dimensions, not
 * a dental scan or a claim of physiological reconstruction.
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Separates each ordered enamel crown from the arch dimensions, spacing and optional inter-crown clearance.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Defines an elliptical maxillary guide and a shared gingival plane in millimetres; individual crowns retain independent profiles.
 */
export interface IPortraitDentalRow {
  /** Positive transverse semiaxis of the arch, in mm. */
  halfWidth: number;

  /** Positive anterior-to-posterior arch semiaxis, in mm. */
  depth: number;

  /** Nonnegative clearance measured along the common arch, in millimetres. */
  gap: number;

  /** Optional minimum inter-crown surface gap along local X, in mm. Omission retains nominal arch placement. */
  contactGap?: number;

  /** Ordered from anatomical right to left; each crown keeps its own dimensions. */
  crowns: readonly IPortraitDentalCrown[];
}
