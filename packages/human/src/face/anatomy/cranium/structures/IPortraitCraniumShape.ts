import { IPortraitCranialStation } from "./IPortraitCranialStation";

/**
 * Optional cranial form controls. Omission reproduces the fixed section
 * construction. A supplied station array replaces the complete sagittal set.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Declares optional scalar, object and object-array cranial controls with replacement semantics.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Keeps fixed defaults and explicit section replacement separate.
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
