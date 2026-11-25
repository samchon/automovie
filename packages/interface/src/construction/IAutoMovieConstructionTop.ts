import type { IAutoMovieConstructionOutline } from "./IAutoMovieConstructionOutline";

/**
 * Fullness owned by a part's third view, the top (a nose's base, a sole, the
 * lips' arch): each quarter's conic shoulder read from the top outline at the
 * view's key stations, carried between them by the natural spline per quarter.
 *
 * The top outline's extremes are the front and side outlines' values at those
 * stations; the outlines keep owning them, and the top view gives only the
 * quarters' fullness.
 */
export interface IAutoMovieConstructionTop {
  /** Discriminator. */
  type: "top";

  /**
   * Each quarter's shoulder share by increasing angle, knots at the top view's
   * key stations, each inside `(0, 1)`.
   */
  shoulders: [
    IAutoMovieConstructionOutline,
    IAutoMovieConstructionOutline,
    IAutoMovieConstructionOutline,
    IAutoMovieConstructionOutline,
  ];
}
