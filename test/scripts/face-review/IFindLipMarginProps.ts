import type { IAutoMovieHumanFaceBasis } from "@automovie/human";
import type { IFaceLipMarginAnchor } from "./IFaceLipMarginAnchor";

/** A source lips region and canonical station inputs for joined vermilion margins.
 * The existing instrument owns sampling and connectivity; this record changes
 * no source vertices, station convention or acceptance guard.
 * @author Samchon
 */
export interface IFindLipMarginProps {
  /** Source surface whose original vertex ordinals the region names. */
  surface: IAutoMovieHumanFaceBasis["surfaces"][number];

  /** Triangle vertex ordinals of the selected lips region. */
  region: readonly number[];

  /** Mandibular-axis direction used to order stations in the source frame. */
  axis: readonly [number, number, number];

  /** Sampling interval in metres; it fixes anchors, not the path between them. */
  stationMetres: number;

  /** Original upper and lower central anchors included in the connected chains. */
  central: IFaceLipMarginAnchor;
}
