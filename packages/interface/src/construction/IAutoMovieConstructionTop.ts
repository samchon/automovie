import type { IAutoMovieConstructionOutline } from "./IAutoMovieConstructionOutline";

/**
 * Fullness owned by a part's third view, the top (a nose's base, a sole, the lips' arch): each quarter's conic shoulder read from the top outline at the view's key stations, carried between them by the natural spline per quarter.
 *
 * The top outline's extremes are the front and side outlines' values at those stations; the outlines keep owning them, and the top view gives only the quarters' fullness.
 *
 * @evidence contracts/common.md#principled-implementation A top outline drawn at key stations is a section shape, which inside its box is its four quarters' shoulders.
 * @evidence contracts/common.md#clear-and-simple-design Four shoulder curves carry the third view in the same quantity the other owners use.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The top view never moves an extreme: a disagreement with the front or side outline is the author's to settle, not averaged.
 * @evidence contracts/common.md#meaningful-documentation States the view's content, the interpolation between key stations and the ownership of the extremes.
 */
export interface IAutoMovieConstructionTop {
  /** Discriminator. */
  type: "top";

  /** Each quarter's shoulder share by increasing angle, knots at the top view's key stations, each inside `(0, 1)`. */
  shoulders: [IAutoMovieConstructionOutline, IAutoMovieConstructionOutline, IAutoMovieConstructionOutline, IAutoMovieConstructionOutline];
}
