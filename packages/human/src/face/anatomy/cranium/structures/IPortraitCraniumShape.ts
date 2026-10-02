import { IPortraitCranialStation } from "./IPortraitCranialStation";

/**
 * Optional cranial form controls. Omission reproduces the fixed section
 * construction. A supplied station array replaces the complete sagittal set.
 *
 * @evidence contracts/common.md#principled-implementation The shape is an optional replacement set of stations, a cap depth, a transition fraction and an angular correspondence frame, all independent of each other; omission reproduces the fixed construction.
 * @evidence contracts/common.md#clear-and-simple-design Four optional members.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts IPortraitCraniumShape carries no behaviour, special case or compensating path; it is a declaration.
 * @evidence contracts/common.md#meaningful-documentation States the counts, the meaning and default of each control, and that a supplied station array replaces the whole set.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres in the head frame; the transition is a dimensionless fraction, stated on the members.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping IPortraitCraniumShape is a declaration and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#emitted-geometry IPortraitCraniumShape decides no primitive population; it only describes data.
 * @evidenceExclude contracts/modeling.md#shared-boundaries IPortraitCraniumShape constructs no surface; it describes data only.
 * @evidenceExclude contracts/modeling.md#rendered-observation IPortraitCraniumShape is a declaration and displays nothing itself; the parts built from it are observed by their owners.
 * @author Samchon
 */
export interface IPortraitCraniumShape {
  /** Five through 64 posterior-ordered sections; empty is invalid for a cranium. */
  stations?: readonly IPortraitCranialStation[];

  /** Nonnegative posterior cap bulge, in mm; default 4. Zero is a planar cap. */
  capDepth?: number;

  /** First transition row's fraction towards the first station, in (0,1); default 0.3. */
  transition?: number;

  /** Angular correspondence frame, independent from the final vault dimensions. */
  frame?: {
    /** Positive transverse semiaxis, in mm; default 71. */
    width: number;

    /** Positive vertical semiaxis, in mm; default 79. */
    height: number;

    /** Vertical frame centre, in mm; default 5. */
    centerY: number;
  };
}
