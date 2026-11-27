import type { IAutoMovieProductionFrameRate } from "../production/IAutoMovieProductionFrameRate.js";

/** Parameters for planning a lossless transparent PNG sequence wrapper. */
export interface IAutoMoviePlanAlphaWrapProps {
  /** Folder of the `frame_%05d.png` files, from frame 0. */
  frameDir: string;

  /** The `.mov` file written. */
  outputPath: string;

  /** Exact frames per second as a numerator/denominator pair. */
  frameRate: Readonly<IAutoMovieProductionFrameRate>;

  /** Frames in the sequence. */
  frameCount: number;
}
