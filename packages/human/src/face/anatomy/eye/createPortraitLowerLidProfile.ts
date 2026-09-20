
import { createPortraitLidSectionSampler } from "./createPortraitLidSectionSampler";
import { IPortraitLowerLidProfile } from "./structures/IPortraitLowerLidProfile";
import { IPortraitLowerLidSection } from "./structures/IPortraitLowerLidSection";
import { roles } from "./structures/roles";
/**
 * Own and interpolate the full lower-lid section. Cubic smoothstep between
 * witnesses keeps each scalar within its endpoints and gives zero longitudinal
 * derivative at a witness. Ordered offsets remain ordered under the same
 * convex weights, so a fold cannot cross its neighbouring tissue row.
 * The consumer still owns shared skin attachment, canthal fade and contact.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Constructs a continuous lower-lid tissue section from complete authored witnesses.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Copies and validates ordered offsets, then uses shared convex smoothstep weights so adjacent tissue rows retain their order.
 */
export function createPortraitLowerLidProfile(
  input: IPortraitLowerLidProfile,
): (at: number) => IPortraitLowerLidSection {
  return createPortraitLidSectionSampler(input.sections, roles, "Lower-lid");
}