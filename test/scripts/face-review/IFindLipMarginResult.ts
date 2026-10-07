import type { IAutoMovieHumanFaceLipMargin } from "@automovie/human";

/** Connected original-vertex margin chains and the same per-shape commissure limit.
 * The existing instrument owns sampling and connectivity; this record changes
 * no source vertices, station convention or acceptance guard.
 * @author Samchon
 */
export interface IFindLipMarginResult {
  /** Connected upper and lower source-vertex chains. */
  margin: IAutoMovieHumanFaceLipMargin;

  /** Measured source-frame station limit toward the commissures, metres. */
  limitMetres: number;
}
