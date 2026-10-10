/**
 * Optional proximal contour on one side of a crown. Mesial faces the arch's
 * midline and distal faces away; the dental group supplies that local direction.
 * The contact crest and incisal corner are different anatomical responsibilities.
 * Omitted fields inherit the crown's basic contour rather than deleting a side.
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
