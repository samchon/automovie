import { IPortraitDentalCrown } from "../../dental/structures/IPortraitDentalCrown";
import { IPortraitLipBandKnot } from "./IPortraitLipBandKnot";
import { IPortraitLipSection } from "./IPortraitLipSection";
import { IPortraitOralChamber } from "./IPortraitOralChamber";

/**
 * Mouth dimensions and an independently replaceable upper dental row. All
 * distances are millimetres; scales multiply the subject's measured socket.
 * The row contains its own crown dimensions rather than one repeated tooth.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Separates lip width, aperture, thickness, relief, cavity and optional legacy enamel dimensions.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Carries metric oral controls, replaceable band/section profiles and individual crown settings relative to the caller's socket.
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
