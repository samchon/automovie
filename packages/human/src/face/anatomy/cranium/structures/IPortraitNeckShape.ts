import { IPortraitNeckSection } from "./IPortraitNeckSection";

/**
 * Authored cervical sections; changing the axis also changes collar mapping.
 * The crop is an open inspection boundary, not a shoulder or torso model.
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

  /** Wider lower section above the crop. */
  lower: IPortraitNeckSection;

  /** Last open section. */
  crop: IPortraitNeckSection;
}
