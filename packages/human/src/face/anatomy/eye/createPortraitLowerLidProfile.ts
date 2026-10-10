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
 *
 * The witnesses are validated and copied by the shared section sampler, which
 * refuses fewer than two or more than 32 sections, a first or last progress
 * other than zero and one, non-increasing progress and a non-positive,
 * non-finite or misordered offset. Offsets and projections are millimetres in
 * the lid's section frame and progress is a dimensionless medial-to-lateral
 * fraction. Every query returns a fresh section.
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
