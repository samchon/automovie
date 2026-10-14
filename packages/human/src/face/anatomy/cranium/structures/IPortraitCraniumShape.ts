import { IPortraitCranialStation } from "./IPortraitCranialStation";

/**
 * Optional cranial form controls. Omission reproduces the fixed section
 * construction. A supplied station array replaces the complete sagittal set.
 *
 *
 * @evidence contracts/common.md#principled-implementation Optional whole sagittal sections, cap bulge, transition and angular correspondence controls define the continuation owner's actual source shape.
 * @evidence contracts/common.md#clear-and-simple-design Independent vault dimensions and correspondence-frame dimensions avoid conflating station shape with facial-oval indexing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An empty replacement section array is invalid and no omitted control is recovered from a personal hidden-cranium measurement.
 * @evidence contracts/common.md#meaningful-documentation Members state count/order, millimetre defaults, zero planar cap, transition interval and positive angular-frame dimensions.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IPortraitCraniumShape is erased by TypeScript and evaluates no anatomy, geometry or material algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IPortraitCraniumShape declares caller data; concrete producers own copying and equivalence rather than this schema caching results.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IPortraitCraniumShape starts no task or handle and retains no runtime state; actual callback/array lifetimes belong to its owners.
 *
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
