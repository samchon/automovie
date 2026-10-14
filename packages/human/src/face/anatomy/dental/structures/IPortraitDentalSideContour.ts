/**
 * Optional proximal contour on one side of a crown. Mesial faces the arch's
 * midline and distal faces away; the dental group supplies that local direction.
 * The contact crest and incisal corner are different anatomical responsibilities.
 * Omitted fields inherit the crown's basic contour rather than deleting a side.
 *
 *
 * @evidence contracts/common.md#principled-implementation Independent proximal crest height, cervical ratio and incisal rise describe one mesial/distal crown side relative to row-owned orientation.
 * @evidence contracts/common.md#clear-and-simple-design Optional side fields inherit the admitted crown's base contour while the dental group determines which direction is mesial.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omitting a field preserves its geometric contour instead of removing the side; crest position and incisal corner remain independent.
 * @evidence contracts/common.md#meaningful-documentation Members give dimensionless contact/cervical ranges, millimetre rise and their exact fallback owners.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IPortraitDentalSideContour is an erased TypeScript contract and performs no geometry or numeric algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IPortraitDentalSideContour declares source inputs/results; concrete producing/consuming operations own copying and equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IPortraitDentalSideContour acquires no runtime task, state or handle; actual array and callback lifetimes stay with their owners.
 *
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
