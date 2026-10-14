import { IPortraitDentalSideContour } from "./IPortraitDentalSideContour";

/**
 * Local enamel dimensions in millimetres. +Y points towards the gingiva and +Z
 * towards the lip. The cervical ratio and cutting-edge rise distinguish crown
 * profiles independently of the dental arch's spacing and orientation.
 *
 *
 * @evidence contracts/common.md#principled-implementation Independent local width, height, half-depth, cervical ratio and side incisal rises describe the canonical closed enamel loft.
 * @evidence contracts/common.md#clear-and-simple-design Whole-crown dimensions and optional mesial/distal contour controls stay separate from arch placement and surface separation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Crown profiles are authored enamel geometry, not inferred roots or an assertion that nominal breadth prevents overlap.
 * @evidence contracts/common.md#meaningful-documentation Members state head-independent millimetres, gingival/lip axes, ratios/rise limits and omitted symmetric contour meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IPortraitDentalCrown is an erased TypeScript contract and performs no geometry or numeric algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IPortraitDentalCrown declares source inputs/results; concrete producing/consuming operations own copying and equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IPortraitDentalCrown acquires no runtime task, state or handle; actual array and callback lifetimes stay with their owners.
 *
 * @author Samchon
 */
export interface IPortraitDentalCrown {
  /** Maximum transverse width. */
  width: number;

  /** Total vertical height. */
  height: number;

  /** Maximum half-depth. */
  depth: number;

  /** Cervical width divided by maximum width, in (0,1]. */
  cervicalWidth: number;

  /** Cutting-edge corners' rise above the centre, in [0,height/2). */
  edgeRise: number;

  /** Independent proximal contours; omission preserves the basic symmetric formula. */
  contour?: {
    /** Midline-facing contour, interpreted using the row's actual mesial direction. */
    mesial?: IPortraitDentalSideContour;

    /** Away-from-midline contour; omission inherits this crown's base dimensions. */
    distal?: IPortraitDentalSideContour;
  };
}
