import { IPortraitLowerLidPoint } from "./IPortraitLowerLidPoint";

/**
 * A complete lower-lid section from its margin through pretarsal fullness and the subtarsal boundary to preseptal skin. The attachment scalar fixes the outer query distance; its depth remains with the consuming eye's shared host rather than a second authored depth here. Authored sample offsets increase strictly in the order listed below; the profile documents the limit of strict separation after numerical interpolation.
 *
 * @evidence contracts/common.md#principled-implementation Named margin, pretarsal, subtarsal and preseptal controls fix authored transverse order while one outer distance lets the eye obtain attachment depth from its shared host.
 * @evidence contracts/common.md#clear-and-simple-design Six stations reuse IPortraitLowerLidPoint and one attachment scalar fixes the outer distance; the section does not invent a second attachment depth.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The live attachment is an explicit shared-boundary contract, with no independently guessed skin depth or per-eye exception stored here.
 * @evidence contracts/common.md#meaningful-documentation Every station's anatomical role and the attachment's greater-than-all-offsets condition are documented beside their fields.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Six station records and one attachment scalar choose no processing strategy; the fixed role traversal occurs in the section sampler.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This transverse schema neither coordinates requests nor retains computed sections; the interpolation closure owns any repeated sampling.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The section holds numerical points only, with no acquired handle or running operation to release.
 *
 * @author Samchon
 */
export interface IPortraitLowerLidSection {
  /** Narrow skin margin outside the wet opening. */
  margin: IPortraitLowerLidPoint;

  /** Crest of the pretarsal roll, distinct from optical contact displacement. */
  pretarsalCrest: IPortraitLowerLidPoint;

  /** Lower shoulder of the pretarsal body. */
  pretarsalLower: IPortraitLowerLidPoint;

  /** Inner side of the boundary below the pretarsal roll. */
  subtarsalInner: IPortraitLowerLidPoint;

  /** Outer side of that boundary, before the broader preseptal transition. */
  subtarsalOuter: IPortraitLowerLidPoint;

  /** Broader skin section beyond the pretarsal roll. */
  preseptal: IPortraitLowerLidPoint;

  /** Outer skin attachment distance, greater than every internal offset. */
  attachment: number;
}
