/**
 * Optional proximal contour on one side of a crown. Mesial faces the arch's
 * midline and distal faces away; the dental group supplies that local direction.
 * The contact crest and incisal corner are different anatomical responsibilities.
 * Omitted fields inherit the crown's basic contour rather than deleting a side.
 *
 * @evidence contracts/common.md#principled-implementation A proximal side is characterized by where its contact crest lies along the crown, how far the crown narrows towards the cervix on that side and how high its incisal corner rises, the three features that differ between mesial and distal faces of a tooth crown.
 * @evidence contracts/common.md#clear-and-simple-design Three optional members that each inherit the crown's basic value, so no field is required to state a side.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type carries data only: no special case, foreign mutation or compensating path exists in it.
 * @evidence contracts/common.md#meaningful-documentation The type states which side is mesial and distal, that the dental group supplies that direction, and the default and range of each member.
 * @evidence contracts/modeling.md#spatial-conventions The crest height and cervical ratio are unitless fractions; the incisal rise is millimetres in the crown's local frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The type refines one side of one crown and is not a part or a group.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The type emits no primitive; the crest height joins the loft's sampled levels, which the constructor adds when it is unsampled.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The type builds no surface; how neighbouring crowns clear each other is the row's separation.
 * @evidenceExclude contracts/modeling.md#rendered-observation The type owns no part, group or joint.
 * @evidenceExclude contracts/anatomy.md#permitted-range The type admits nothing; `assertPortraitDentalCrown` bounds each member.
 * @evidence contracts/anatomy.md#parametric-authority Each member is a named proximal feature of a crown; none addresses a vertex, curve or patch.
 * @author Samchon
 */
export interface IPortraitDentalSideContour {
  /** Contact-crest height from incisal zero to cervical one, in (0,1); default 0.3. */
  contactHeight?: number;

  /** Side's cervical/maximal half-width ratio, in (0,1]; default crown cervicalWidth. */
  cervicalWidth?: number;

  /** Incisal corner rise in mm, in [0,height/2); default crown edgeRise. */
  incisalRise?: number;
}
