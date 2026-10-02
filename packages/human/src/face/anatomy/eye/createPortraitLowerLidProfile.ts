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
 *
 * @evidence contracts/common.md#principled-implementation The profile is the shared section sampler applied to the six lower-lid roles, whose convex smoothstep weights keep every scalar between its witnesses and preserve the strict order of the offsets, so a fold cannot cross its neighbouring row.
 * @evidence contracts/common.md#clear-and-simple-design A one-line specialization of the generic sampler with the lower-lid roles, so the interpolation has one owner shared with the upper lid.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The profile is a function of its witnesses alone, with no case named after a subject or fixture.
 * @evidence contracts/common.md#meaningful-documentation The comment states the interpolation and what it preserves, the validation the sampler performs, the units, and that the consumer owns attachment, fade and contact.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres in the lid's section frame and a dimensionless progress, converted nowhere here.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function builds a sampler over section witnesses and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines no channel; the section fields are declared by the section types.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface; the eye owns the shared skin attachment.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part and displays nothing; the lower lid built from it is observed under the eye component.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value; it interpolates the witnesses its caller supplies.
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
