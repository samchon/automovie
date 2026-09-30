import { IPortraitUpperLidPoint } from "./IPortraitUpperLidPoint";

/**
 * Upper tissue from the dry margin through the tarsal body and supratarsal
 * crease into the hood and preseptal transition. The ordinary profile orders
 * all offsets strictly. A profile with explicit closed sections can return
 * the hood across the crease, while retaining a simple transverse skin curve.
 * Relief replaces the basic fold depth and volume rather than adding them twice.
 *
 * @evidence contracts/common.md#principled-implementation Six named stations from the dry margin to the preseptal transition plus an attachment distance describe one transverse section, and the profile's optional closed sections admit the hood's inward return that a strict ordering would forbid.
 * @evidence contracts/common.md#clear-and-simple-design A flat record of six stations and one distance, interpolated by the sampler it shares with the lower lid.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A type carries no mechanism and no field names a subject or fixture.
 * @evidence contracts/common.md#meaningful-documentation Each station states the tissue it names, and the record says when the hood may return inward, that relief replaces the basic fold and that the attachment exceeds every offset.
 * @evidence contracts/modeling.md#spatial-conventions Offsets and projections are millimetres in the lid's section frame and the attachment is a millimetre distance, as the member types state.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record is a section of one lid and defines no part or group.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no surface; the attachment is the distance at which the host skin is queried and its depth is owned by the host.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record owns no part and displays nothing.
 *
 * @author Samchon
 */
export interface IPortraitUpperLidSection {
  /** Narrow dry margin outside the ocular contact rim. */
  margin: IPortraitUpperLidPoint;

  /** Exposed pretarsal body below the supratarsal crease. */
  tarsal: IPortraitUpperLidPoint;

  /** Lower bank of the crease, distinct from tarsal fullness. */
  creaseInner: IPortraitUpperLidPoint;

  /** Upper bank of the crease before the overlying hood. */
  creaseOuter: IPortraitUpperLidPoint;

  /** Visible hood edge; only an explicitly unfolding profile permits its inward return. */
  hood: IPortraitUpperLidPoint;

  /** Broader continuation toward orbital skin. */
  preseptal: IPortraitUpperLidPoint;

  /** Outer skin-query distance, greater than all six tissue offsets, in mm. */
  attachment: number;
}
