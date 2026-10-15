import type { IAutoMovieVector3 } from "@automovie/interface";

/** World-axis-aligned box in metres, as the engine reports placed element bounds. */
export type Box = {
  /** Corner with the smallest x, y and z. */
  min: IAutoMovieVector3;

  /** Corner with the largest x, y and z. */
  max: IAutoMovieVector3;
};
