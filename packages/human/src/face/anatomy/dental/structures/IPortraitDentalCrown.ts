import { IPortraitDentalSideContour } from "./IPortraitDentalSideContour";

/**
 * Local enamel dimensions in millimetres. +Y points towards the gingiva and +Z
 * towards the lip. The cervical ratio and cutting-edge rise distinguish crown
 * profiles independently of the dental arch's spacing and orientation.
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
    mesial?: IPortraitDentalSideContour;
    distal?: IPortraitDentalSideContour;
  };
}
