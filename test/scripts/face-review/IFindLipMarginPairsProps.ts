import type { IAutoMovieHumanFaceBasis } from "@automovie/human";

/** Source region and metre-spaced stations for per-shape vermilion anchors.
 * The existing instrument owns sampling and connectivity; this record changes
 * no source vertices, station convention or acceptance guard.
 * @author Samchon
 */
export interface IFindLipMarginPairsProps {
  /** Source surface whose vertex ordinals the region names. */
  surface: IAutoMovieHumanFaceBasis["surfaces"][number];

  /** Triangle vertex ordinals of the lips region. */
  region: readonly number[];

  /** Mandibular-axis direction in the source coordinate frame. */
  axis: readonly [number, number, number];

  /** Metre spacing of sampled anchors toward each commissure. */
  stationMetres: number;
}
