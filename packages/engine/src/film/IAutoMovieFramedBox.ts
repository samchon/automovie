import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * What the framing grammar solves a camera distance and an aim height from.
 *
 * `base` is the bottom of what the camera sees, `height` the vertical span
 * above it, and `radius` half the widest horizontal span, measured about the
 * base rather than about any one member. The three together are the box below,
 * restated in the terms {@link compileCameraMove} consumes.
 */
export interface IAutoMovieFramedBox {
  /** Bottom-centre of the box. */
  base: IAutoMovieVector3;

  /** Vertical span of the box, in meters. */
  height: number;

  /** Half the box's horizontal diagonal, in meters. */
  radius: number;
}
