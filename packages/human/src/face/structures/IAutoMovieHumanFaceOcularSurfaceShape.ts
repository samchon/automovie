import type { IPortraitOcularTissueShape } from "../anatomy/eye/structures/IPortraitOcularTissueShape";

/** Coarse medial conjunctival sheet and independently authored upper/lower wet margins.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceOcularSurfaceShape extends IPortraitOcularTissueShape {
  /** Optional upper wet-margin maximum width in mm; requires upperMarginLift. */
  upperMarginWidth?: number;
  /** Upper rounded anterior relief in mm; requires upperMarginWidth. */
  upperMarginLift?: number;
}
