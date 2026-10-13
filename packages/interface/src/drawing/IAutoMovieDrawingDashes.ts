import { AutoMovieDrawingRole } from "./AutoMovieDrawingRole";

/** Dash pattern in page millimetres, per line role; an empty array is solid. */
export type IAutoMovieDrawingDashes = {
  [role in AutoMovieDrawingRole]: number[];
};
