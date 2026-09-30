import { IPortraitNeckSection } from "./IPortraitNeckSection";

/**
 * Authored cervical sections; changing the axis also changes collar mapping.
 * The crop is an open inspection boundary, not a shoulder or torso model.
 *
 * @evidence contracts/common.md#principled-implementation The neck is three ordered sections plus one optional anterior projection, which is what the cervical builder needs to form the throat, nape and open crop.
 * @evidence contracts/common.md#clear-and-simple-design Four members.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts IPortraitNeckShape carries no behaviour, special case or compensating path; it is a declaration.
 * @evidence contracts/common.md#meaningful-documentation States that changing the axis changes the collar mapping, that the crop is an open inspection boundary and how the submental bulge is shaped and bounded.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres in the head frame; the submental projection is a length in millimetres.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping IPortraitNeckShape is a declaration and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#emitted-geometry IPortraitNeckShape decides no primitive population; it only describes data.
 * @evidenceExclude contracts/modeling.md#shared-boundaries IPortraitNeckShape constructs no surface; it describes data only.
 * @evidenceExclude contracts/modeling.md#rendered-observation IPortraitNeckShape is a declaration and displays nothing itself; the parts built from it are observed by their owners.
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
