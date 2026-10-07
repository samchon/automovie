import type { IHumanFaceSkinSeat } from "../../skin/IHumanFaceSkinSeat";

/** One located plate border, retaining its actual material attachment and chart coordinate.
 *
 * @author Samchon
 */
export interface IHumanFacePeriocularArcLocation {
  /** Dimensionless source material coordinate used to interpolate the tissue band. */
  coordinate: [number, number];

  /** Actual host triangle identity and ordered barycentric weights. */
  seat: IHumanFaceSkinSeat;
}
