import { AutoMovieDrawingRole } from "./AutoMovieDrawingRole";

/** Stroke width in page millimetres, per line role. */
export type IAutoMovieDrawingWeights = {
  [role in AutoMovieDrawingRole]: number;
};
