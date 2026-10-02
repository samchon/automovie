import { IPortraitDentalCrown } from "../../dental/structures/IPortraitDentalCrown";
import { IPortraitLipBandKnot } from "./IPortraitLipBandKnot";
import { IPortraitLipSection } from "./IPortraitLipSection";
import { IPortraitOralChamber } from "./IPortraitOralChamber";

/**
 * Mouth dimensions and an independently replaceable upper dental row. All
 * distances are millimetres; scales multiply the subject's measured socket.
 * The row contains its own crown dimensions rather than one repeated tooth.
 *
 * @evidence contracts/common.md#principled-implementation Every member is a dimension the mouth fit consumes: width and opening scales about the measured socket, corner lift, projections, an optional section, band ratios, border refinement, blend reach and the oral cavity and legacy crown placement. Scales multiply the measured socket, so the identity configuration reproduces the subject's own mouth.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type carries data only: no special case, foreign mutation or compensating path exists in it.
 * @evidence contracts/common.md#meaningful-documentation Each member states its unit, sign, admitted range and what omission means, and the type states that scales multiply the measured socket.
 * @evidence contracts/modeling.md#spatial-conventions All distances are millimetres in the head frame with +Z forward; scales are unitless multipliers about the measured socket's centre; crown lists run from negative to positive X.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The type emits no primitive.
 * @evidence contracts/modeling.md#shared-boundaries The members that touch a boundary state their effect on it: the section and seam projection are zero on the shared band edges and corners, band thickness scales about the actual inner curve, and the oral rim is fixed by cavity construction.
 * @evidenceExclude contracts/modeling.md#rendered-observation The type owns no part, group or joint by itself; the observation belongs to the component that consumes it.
 * @evidenceExclude contracts/anatomy.md#permitted-range The type admits nothing; `createPortraitMouthComponent` and its helpers refuse values outside the documented ranges.
 * @author Samchon
 */
export interface IPortraitMouthShape {
  /** Width multiplier about the centre between the mouth corners. */
  widthScale: number;

  /** Height multiplier about the measured opening centre. */
  openingScale: number;

  /** Upward movement of both corners, fading to zero at the midline. */
  cornerLift: number;

  /** Upper vermilion projection in host Z. Zero retains measured depth. */
  upperLipProjection: number;

  /** Lower vermilion projection in host Z. Zero retains measured depth. */
  lowerLipProjection: number;

  /**
   * Shared oral-rim projection in host Z, in mm. Positive advances the contact
   * line and negative deepens it, without moving the outer vermilion boundary
   * or changing aperture XY. Smoothly fades through both lip bands and at the
   * corners. Omission is zero; closed paired rims stay coincident.
   */
  seamProjection?: number;

  /** Optional body and tubercle relief between the existing lip boundaries. */
  section?: IPortraitLipSection;

  /**
   * Optional upper/lower thickness ratios over the curved mouth. A scalar sets
   * the centre; a knot array states a nonuniform profile. Omission is identity.
   * Both preserve the existing oral opening and corner positions. The outer
   * cutaneous boundary and neighbouring skin follow the resulting band shape.
   */
  band?: {
    upper?: number | readonly IPortraitLipBandKnot[];
    lower?: number | readonly IPortraitLipBandKnot[];
  };

  /**
   * Optional cutaneous-vermilion boundary refinement. `curve` gives this
   * closed boundary its own cubic subdivision rule while sharing it with the
   * adjoining skin. Omission or `surface` uses the general surface weights.
   * This retains the inner boundary's refinement rule and adds no pigment
   * overlay. Later rounds can propagate the new outer positions into adjacent
   * lip vertices, so final inner-rim coordinates still require comparison.
   */
  borderRefinement?: "surface" | "curve";

  /** Geodesic reach of surrounding skin adaptation. */
  blendReach: number;

  /** Recession of the oral cavity behind the actual refined opening. */
  cavityDepth: number;

  /**
   * Optional straight-wall fraction [0,0.95] before the posterior cosine taper.
   * Selecting a fraction joins the actual refined oral rim to an enclosure at
   * 1.8 cavityDepth in head -Z. Zero starts tapering at the rim; omission keeps
   * the legacy detached backdrop. This does not set tongue or dental placement.
   */
  cavityWall?: number;

  /** Optional internal room beyond the vestibule. Requires explicit cavityWall; never moves teeth or the lip rim. */
  cavityChamber?: IPortraitOralChamber;

  /** Signed distance of the dental row along the arch from the lip midpoint. */
  dentalOffset: number;

  /** Recession of crown centres behind the upper inner lip. */
  dentalRecess: number;

  /** Downward distance from the upper inner lip to the crown centres. */
  dentalDrop: number;

  /** Half-depth of the crowns along their local arch normal. */
  dentalDepth: number;

  /** Clearance along the arch; changing it never shrinks a crown's width. */
  toothGap: number;

  /** Individual crown widths and heights, ordered from negative to positive X. */
  crowns: {
    width: number;
    height: number;
    cervicalWidth?: number;
    edgeRise?: number;

    /** Optional proximal detail, oriented by the common dental arch. */
    contour?: IPortraitDentalCrown["contour"];
  }[];
}
