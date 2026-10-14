import type { IPortraitEyebrowFlowSection } from "./IPortraitEyebrowFlowSection";

/**
 * Complete medial-to-lateral flow witnesses. Lower and upper describe the two
 * ends of the authored root band, independently of the hair's radius or count.
 * Interpolation across the root band permits convergence without adding fibres.
 *
 *
 * @evidence contracts/common.md#principled-implementation Complete ordered witnesses specify both lower and upper root-band directions from medial zero to lateral one.
 * @evidence contracts/common.md#clear-and-simple-design The profile stores witness sections while createPortraitEyebrowFlow owns copying, admission and interpolation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Interpolation changes direction without adding fibres or substituting count/radius for root-band extent.
 * @evidence contracts/common.md#meaningful-documentation The member documents complete increasing endpoint witnesses and the prose separates grain from population.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IPortraitEyebrowFlowProfile is a TypeScript-only schema and executes no guide, surface or field algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IPortraitEyebrowFlowProfile declares inputs or results; copying and equivalence belong to its concrete producer/consumer.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IPortraitEyebrowFlowProfile acquires no runtime state or handle; array, map and callback lifetimes remain with their owning operations.
 *
 * @author Samchon
 */
export interface IPortraitEyebrowFlowProfile {
  /** Strictly increasing complete witnesses, including medial zero and lateral one. */
  sections: readonly IPortraitEyebrowFlowSection[];
}
