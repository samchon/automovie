import { createPortraitLidSectionSampler } from "./createPortraitLidSectionSampler";
import { IPortraitLowerLidProfile } from "./structures/IPortraitLowerLidProfile";
import { IPortraitLowerLidSection } from "./structures/IPortraitLowerLidSection";
import { portraitLowerLidRoles } from "./structures/portraitLowerLidRoles";

/**
 * Own and interpolate the full lower-lid section. Cubic smoothstep between
 * witnesses keeps each scalar within its endpoints and gives zero longitudinal
 * derivative at a witness. Convex weights preserve order mathematically;
 * binary64 rounding of very close controls can lose strict separation, which
 * this profile does not independently revalidate at query time.
 * The consumer still owns shared skin attachment, canthal fade and contact.
 *
 * The witnesses are validated and copied by the shared section sampler, which
 * refuses fewer than two or more than 32 sections, a first or last progress
 * other than zero and one, non-increasing progress and a non-positive,
 * non-finite or misordered offset. Offsets and projections are millimetres in
 * the lid's section frame and progress is a dimensionless medial-to-lateral
 * fraction. Every query returns a fresh section.
 *
 * @evidence contracts/common.md#principled-implementation The shared smoothstep sampler interpolates ordered lower-lid section controls while preserving scalar endpoint bounds.
 * @evidence contracts/common.md#clear-and-simple-design Named lower roles delegate common longitudinal arithmetic/admission rather than maintaining another sampler.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Section order is not a complete three-dimensional fold/contact proof; canthal fade and shared attachment remain consumers' obligations.
 * @evidence contracts/common.md#meaningful-documentation The prose states millimetres, dimensionless progress, copied witnesses and fresh query ownership.
 * @evidence contracts/performance.md#efficient-algorithms Canonical bounded-witness admission and fixed lower-role query interpolation dominate.
 * @evidence contracts/performance.md#reuse-equivalent-work One compiled copied witness population serves repeated lower-lid queries through the shared sampler.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned sampler owns copied sections until caller release; query records are fresh and no external resource is acquired.
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
