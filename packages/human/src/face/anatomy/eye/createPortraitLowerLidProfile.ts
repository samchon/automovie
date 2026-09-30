import { createPortraitLidSectionSampler } from "./createPortraitLidSectionSampler";
import { IPortraitLowerLidProfile } from "./structures/IPortraitLowerLidProfile";
import { IPortraitLowerLidSection } from "./structures/IPortraitLowerLidSection";
import { portraitLowerLidRoles } from "./structures/portraitLowerLidRoles";

/**
 * Own and interpolate the full lower-lid section. Cubic smoothstep between
 * witnesses keeps each scalar within its endpoints and gives zero longitudinal
 * derivative at a witness. Ordered offsets remain ordered under the same
 * convex weights, so a fold cannot cross its neighbouring tissue row.
 * The consumer still owns shared skin attachment, canthal fade and contact.
 */
export function createPortraitLowerLidProfile(
  input: IPortraitLowerLidProfile,
): (at: number) => IPortraitLowerLidSection {
  return createPortraitLidSectionSampler(
    input.sections,
    portraitLowerLidRoles,
    "Lower-lid",
  );
}
