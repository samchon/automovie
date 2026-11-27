import type { AutoMovieDrawingRole } from "./AutoMovieDrawingRole";

/**
 * Dash pattern in page millimetres, per line role; an empty array is solid.
 *
 * Entries alternate dash and gap lengths as SVG `stroke-dasharray` does, and
 * `drawingToSvg` throws unless each one is finite and positive.
 */
export type IAutoMovieDrawingDashes = {
  [role in AutoMovieDrawingRole]: number[];
};
