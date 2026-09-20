import { IPortraitEyebrowProfile } from "./IPortraitEyebrowProfile";

/**
 * Authored brow fibre dimensions; these are rendering controls, not measured hair data.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Supplies reusable fibre dimensions for brows fitted to caller-owned skin.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Provides the default strand radius, taper, arch, bend and sample count; it does not supply a person's brow boundary.
 */
export const portraitEyebrowProfile: IPortraitEyebrowProfile = {
  // Provisional fibre dimensions preserve a visible strand at close range.
  // A subject supplies its own density, distribution and optical judgement.
  radius: 0.05,
  radiusStep: 0.0075,
  // A gentler loss keeps the lateral ends legible instead of dissolving into
  // isolated dark points after the five longitudinal samples are rasterised.
  taper: 0.58,
  clearance: 0.03,
  // Lift remains shallow; it separates the enlarged fibres from the skin
  // without making a raised brow ridge or covering the upper lid.
  arch: 0.1,
  outwardBend: 1.2,
  segments: 5,
};
