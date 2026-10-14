import { IPortraitNeckSection } from "./IPortraitNeckSection";

/**
 * Authored cervical sections; changing the axis also changes collar mapping.
 * The crop is an open inspection boundary, not a shoulder or torso model.
 *
 *
 * @evidence contracts/common.md#principled-implementation Upper/lower/crop sections and optional compact anterior projection define the same authored cervical continuation and open crop boundary.
 * @evidence contracts/common.md#clear-and-simple-design Section geometry is separate from the optional collar-to-upper projection envelope and its preserved endpoint tangents.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The submental envelope is not measured fat thickness and the open crop is not a shoulder/torso model.
 * @evidence contracts/common.md#meaningful-documentation Members give the 0..40-mm projection, half-transition peak, lateral fade, omission and the three section roles.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IPortraitNeckShape is erased by TypeScript and evaluates no anatomy, geometry or material algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IPortraitNeckShape declares caller data; concrete producers own copying and equivalence rather than this schema caching results.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IPortraitNeckShape starts no task or handle and retains no runtime state; actual callback/array lifetimes belong to its owners.
 *
 * @author Samchon
 */
export interface IPortraitNeckShape {
  /**
   * Anterior submental bulge in mm, from 0 through 40; omission is zero.
   * Peaks halfway from collar to upper neck on the anterior meridian, fading
   * with squared positive cosine laterally. Both ends retain their tangents.
   * This authored surface envelope is not a measured fat thickness.
   */
  submentalProjection?: number;

  /** Upper cervical section below the complete cranial attachment. */
  upper: IPortraitNeckSection;

  /** Lower section above the crop; its width is independently authored. */
  lower: IPortraitNeckSection;

  /** Last open section. */
  crop: IPortraitNeckSection;
}
