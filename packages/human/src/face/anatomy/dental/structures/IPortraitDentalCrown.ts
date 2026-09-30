import { IPortraitDentalSideContour } from "./IPortraitDentalSideContour";

/**
 * Local enamel dimensions in millimetres. +Y points towards the gingiva and +Z
 * towards the lip. The cervical ratio and cutting-edge rise distinguish crown
 * profiles independently of the dental arch's spacing and orientation.
 *
 * @evidence contracts/common.md#principled-implementation A crown's enamel is described by its maximum width, height and half-depth, the cervical width ratio and the cutting-edge rise, plus optional independent proximal contours, which are the quantities that distinguish incisor, canine and premolar crowns in the lofted construction that consumes them.
 * @evidence contracts/common.md#clear-and-simple-design Six members, each a distinct dimension; spacing and orientation belong to the row.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type carries data only: no special case, foreign mutation or compensating path exists in it.
 * @evidence contracts/common.md#meaningful-documentation The type states the axes (+Y gingival, +Z labial), each member's unit and admitted range, and that omission of the contour keeps the basic symmetric formula.
 * @evidence contracts/modeling.md#spatial-conventions All lengths are millimetres in the crown's local frame with +Y towards the gingiva and +Z towards the lip; the cervical ratio is unitless.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The type describes the enamel of one tooth crown, the smallest part, and composes nothing; hidden roots are not modelled.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The type emits no primitive; the loft's ring and column counts come from its constructor.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The type builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The type owns no part, group or joint.
 * @evidenceExclude contracts/anatomy.md#permitted-range The type admits nothing; `assertPortraitDentalCrown` bounds every member.
 * @evidence contracts/anatomy.md#parametric-authority Each member is a named crown dimension or a named proximal contour in millimetres or as a unitless ratio; none addresses a vertex, curve or patch.
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
