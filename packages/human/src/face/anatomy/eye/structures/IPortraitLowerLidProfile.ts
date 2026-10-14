import { IPortraitLowerLidSection } from "./IPortraitLowerLidSection";

/**
 * Optional longitudinal detail for one eye, ordered from anatomical medial zero to lateral one independently of head-X side. The sampler copies and validates two through 32 witnesses spanning both ends. Smoothstep preserves scalar endpoint bounds mathematically; binary64 interpolation does not independently recheck strict offset separation.
 *
 * The eye blends detailed tissue toward the basic canthi and keeps the live skin attachment. Omission retains basic rows unless another explicit lower-roll control is supplied. When aegyoSal is present it supplies the transverse lower-roll points instead of this profile, while this profile's attachment can still set the outer seam.
 *
 * @evidence contracts/common.md#principled-implementation Medial-to-lateral witnesses describe complete transverse sections admitted and copied by the shared smoothstep sampler; strict order follows convex arithmetic mathematically but can lose separation after binary64 rounding.
 * @evidence contracts/common.md#clear-and-simple-design One readonly witness array groups progress with its full transverse section without duplicating the eye's canthal fade or host queries.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omission and explicit aegyoSal precedence are supported modes, not substitutes after a profile fails; a detailed section alone supplies no whole-eye collision or visual proof.
 * @evidence contracts/common.md#meaningful-documentation The prose gives witness bounds and anatomical ordering, copy ownership, rounding limits, canthal blending and the separate lower-roll control's precedence.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The readonly profile schema performs no interpolation itself; witness-count work is owned by createPortraitLowerLidProfile and its shared sampler.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A supplied witness population is input data rather than a result cache; copying and repeated sample reuse are decisions of the profile producer.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Sections reference caller-provided values without acquiring resources; the consuming sampler makes its own validated copy.
 *
 * @author Samchon
 */
export interface IPortraitLowerLidProfile {
  /** Two through 32 strictly ordered section witnesses, including zero and one. */
  sections: readonly {
    /** Medial-to-lateral progress in [0,1]. */
    at: number;

    /** Complete transverse tissue section at this progress. */
    section: IPortraitLowerLidSection;
  }[];
}
