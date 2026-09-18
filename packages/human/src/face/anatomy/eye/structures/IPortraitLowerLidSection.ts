import { IPortraitLowerLidPoint } from "./IPortraitLowerLidPoint";

/**
 * A complete lower-lid section from its margin through pretarsal fullness and
 * the subtarsal boundary to preseptal skin. The attachment is a live skin query,
 * so its depth is owned by the host rather than supplied a second time here.
 * Internal sample positions increase strictly in the order listed below.
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Distinguishes margin, pretarsal roll, subtarsal boundary and preseptal continuation in one eyelid section.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Requires six ordered tissue stations and an outer live-skin attachment beyond them.
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
