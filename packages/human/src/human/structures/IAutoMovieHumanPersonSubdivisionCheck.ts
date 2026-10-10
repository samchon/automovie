import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanPersonBoundaryStitchProps } from "./IAutoMovieHumanPersonBoundaryStitchProps";

/**
 * Inputs of `assertHumanPersonSubdivision`: the stitch being performed, the
 * positions emitted so far, the region's triangles, and one emitted piece of
 * one original triangle.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSubdivisionCheck {
  /** The stitch being performed. */
  stitch: IAutoMovieHumanPersonBoundaryStitchProps;

  /** The positions emitted so far, the piece's corners among them. */
  emitted: readonly number[];

  /** The region's triangles, as the stitch reads them. */
  indices: readonly number[];

  /** The original triangle's area vector before subdivision. */
  before: IAutoMovieVector3;

  /** The original triangle's corners. */
  original: number[];

  /** The emitted piece's corners. */
  corners: number[];

  /** The original triangle's ordinal. */
  triangle: number;

  /** The original triangle's perimeter after boundary points were inserted. */
  perimeter: number[];
}
