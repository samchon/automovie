import { IPortraitLowerLidPoint } from "./IPortraitLowerLidPoint";

/**
 * A complete lower-lid section from its margin through pretarsal fullness and
 * the subtarsal boundary to preseptal skin. The attachment is a live skin query,
 * so its depth is owned by the host rather than supplied a second time here.
 * Internal sample positions increase strictly in the order listed below.
 *
 * @evidence contracts/common.md#principled-implementation Six named stations from the dry margin to preseptal skin plus an attachment distance describe one transverse section, and the strict ordering enforced by the section sampler is what keeps the rows from crossing.
 * @evidence contracts/common.md#clear-and-simple-design A flat record of six stations and one distance, interpolated by one sampler shared with the upper lid.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A type carries no mechanism and no field names a subject or fixture.
 * @evidence contracts/common.md#meaningful-documentation Each station states the tissue it names, and the record says that the attachment is a live skin query owned by the host and that offsets increase strictly in the listed order.
 * @evidence contracts/modeling.md#spatial-conventions Offsets and projections are millimetres in the lid's section frame and the attachment is a distance in millimetres, as the member types state.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record is a section of one lid and defines no part or group.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no surface; the attachment is the boundary shared with the host skin and its depth is queried from the host, not supplied here.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record owns no part and displays nothing.
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
