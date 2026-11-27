import type { AutoMovieDrawingRole } from "./AutoMovieDrawingRole";

/**
 * Stroke width in page millimetres, per line role.
 *
 * Every role needs a width, and `drawingToSvg` throws when one is not
 * a finite positive number. The `cut` width also strokes opening outlines and
 * the `projected` width strokes dimension lines.
 */
export type IAutoMovieDrawingWeights = {
  [role in AutoMovieDrawingRole]: number;
};
