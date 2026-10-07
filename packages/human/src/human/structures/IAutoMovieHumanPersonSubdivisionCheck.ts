import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanPersonBoundaryStitchProps } from "./IAutoMovieHumanPersonBoundaryStitchProps";

/**
 * Inputs of `assertHumanPersonSubdivision`: the stitch being performed, the
 * positions emitted so far, the region's triangles, and one emitted piece of
 * one original triangle.
 *
 * @evidence contracts/common.md#principled-implementation The check reads the stitch's own inputs, so its refusal reports the same seam and collar the stitch used.
 * @evidence contracts/common.md#clear-and-simple-design Eight fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The original area vector is the unsubdivided triangle's, never the emitted one's.
 * @evidence contracts/common.md#meaningful-documentation States what each field is.
 * @evidence contracts/modeling.md#spatial-conventions Positions are posed metres; the area vector is in square metres.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The check defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The check carries no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The stitch emits the geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The stitch owns the boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The check is not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The check carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The check admits geometry, not anatomy.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The check converts no input.
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
