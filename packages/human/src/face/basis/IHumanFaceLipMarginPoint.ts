import type { IAutoMovieVector3 } from "@automovie/interface";

/** One legacy vertex or native material seat read on actual geometry.
 *
 * @author Samchon
 */
export interface IHumanFaceLipMarginPoint {
  /** Actual point from the canonical represented interpolation. */
  point: IAutoMovieVector3;

  /** Native support vertices; legacy support has one vertex and weight one. */
  vertices: readonly number[];

  /** Matching coefficients, never normalized by the reader. */
  weights: readonly number[];

  /** Stable source material identity for the same physical join. */
  identity: string;

  /** Exact source vertex only when this point is that original anchor. */
  nativeVertex: number | null;
}
