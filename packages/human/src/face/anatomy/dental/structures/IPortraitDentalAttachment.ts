import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Rigid placement shared by the entire dental row. The corner chord defines X;
 * the supplied upward guide is orthogonalized against it to define Y. Z=X cross
 * Y faces anteriorly. The origin is the supplied central lip reference, translated
 * once by the group's lift and recess. Corner points establish orientation,
 * never per-tooth positions or scaling. All points and offsets use millimetres.
 *
 *
 * @evidence contracts/common.md#principled-implementation The right-to-left chord and independent upward guide define one orthonormal rigid frame for the entire dental group.
 * @evidence contracts/common.md#clear-and-simple-design Corner orientation, lip-midpoint origin and lift/recess remain distinct controls for the shared oral placement owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The frame performs no per-tooth scaling or position fitting; degenerate/non-finite guides retain the oral owner's named refusal.
 * @evidence contracts/common.md#meaningful-documentation Members document millimetres, local axes and signed offsets; upperLipMiddle is the established field name also used for the mandibular caller's lower-lip origin.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IPortraitDentalAttachment is an erased TypeScript contract and performs no geometry or numeric algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IPortraitDentalAttachment declares source inputs/results; concrete producing/consuming operations own copying and equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IPortraitDentalAttachment acquires no runtime task, state or handle; actual array and callback lifetimes stay with their owners.
 *
 * @author Samchon
 */
export interface IPortraitDentalAttachment {
  /** Anatomical right oral corner in head millimetres. */
  rightCorner: IAutoMovieVector3;

  /** Anatomical left oral corner; its chord from the right defines local +X. */
  leftCorner: IAutoMovieVector3;

  /** Lip midpoint supplying the arch's origin; the mandibular caller supplies its lower-lip midpoint under this established field name. */
  upperLipMiddle: IAutoMovieVector3;

  /** Finite nonzero upward guide, independent of the corner chord. */
  up: IAutoMovieVector3;

  /** Signed upward placement from the supplied lip midpoint along the group's Y axis, in mm. */
  lift: number;

  /** Signed posterior placement from the supplied lip midpoint, in mm. */
  recess: number;
}
