/**
 * Group-owned aperture placement; broad body sections never refit these axes.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Separates vestibular placement from broader nasal-body shaping.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Defines one group-owned millimetre origin and nonzero inward axis that body sections cannot refit.
 * @author Samchon
 */
export interface IPortraitNasalApertureFrame {
  /** Vestibular axis origin in head millimetres. */
  origin: readonly number[];

  /** Nonzero inward direction, normalized independently of the body sections. */
  inward: readonly number[];
}
