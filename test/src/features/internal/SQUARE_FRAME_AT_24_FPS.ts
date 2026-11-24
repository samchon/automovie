import type { IAutoMoviePerformShotProps } from "@automovie/interface";

/**
 * A delivery clock of 24 frames per second with no raster, for `performShot`
 * tests whose expectations assume both: a moving camera is keyed at every 24
 * fps frame, and a side of zero selects the documented square-frame fit.
 */
export const SQUARE_FRAME_AT_24_FPS: NonNullable<
  IAutoMoviePerformShotProps["frameFormat"]
> = { width: 0, height: 0, fps: 24 };
