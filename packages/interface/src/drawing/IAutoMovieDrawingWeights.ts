import { AutoMovieDrawingRole } from "./AutoMovieDrawingRole";

/**
 * Stroke width in page millimetres, per line role.
 *
 * Every role needs a width, and `autoMovieDrawingToSvg` throws when one is not
 * a finite positive number.
 *
 * @author Samchon
 */
export type IAutoMovieDrawingWeights = {
  [role in AutoMovieDrawingRole]: number;
};
