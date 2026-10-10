import { IPortraitUpperLidPoint } from "./IPortraitUpperLidPoint";

/**
 * Upper tissue from the dry margin through the tarsal body and supratarsal
 * crease into the hood and preseptal transition. The ordinary profile orders
 * all offsets strictly. A profile with explicit closed sections can return
 * the hood across the crease, while retaining a simple transverse skin curve.
 * Relief replaces the basic fold depth and volume rather than adding them twice.
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
