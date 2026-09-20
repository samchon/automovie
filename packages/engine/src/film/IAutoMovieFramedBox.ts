import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * What the framing grammar solves a camera distance and an aim height from.
 *
 * `base` is the bottom of what the camera sees, `height` the vertical span
 * above it, and `radius` half the widest horizontal span, measured about the
 * base rather than about any one member. The three together are the box below,
 * restated in the terms {@link compileCameraMove} consumes.
 *
 * @evidence requirements/camera/framing-and-shot-size.md#camera-landmark-framing IAutoMovieFramedBox exposes the base, height, and radius consumed directly by the landmark framing solve.
 * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-framing-landmark-relations IAutoMovieFramedBox realizes landmark-based framing: What the framing grammar solves a camera distance and an aim height from. `base` is the bottom of what the camera sees, `height` the vertical span above it, and `radius` half the widest horizontal span, measured about the base rather than about any one member. The three together are the box below, restated in the terms {@link compileCameraMove} consumes.
 */
export interface IAutoMovieFramedBox {
  /**
   * Bottom-centre of the box.
   *
   * @evidence requirements/camera/framing-and-shot-size.md#camera-landmark-framing IAutoMovieFramedBox.base drives required-landmark framing: Bottom-centre of the box.
   * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-framing-landmark-relations IAutoMovieFramedBox.base realizes landmark-based framing: Bottom-centre of the box.
   */
  base: IAutoMovieVector3;

  /**
   * Vertical span of the box, in meters.
   *
   * @evidence requirements/camera/framing-and-shot-size.md#camera-landmark-framing IAutoMovieFramedBox.height drives required-landmark framing: Vertical span of the box, in meters.
   * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-framing-landmark-relations IAutoMovieFramedBox.height realizes landmark-based framing: Vertical span of the box, in meters.
   */
  height: number;

  /**
   * Half the box's horizontal diagonal, in meters.
   *
   * @evidence requirements/camera/framing-and-shot-size.md#camera-landmark-framing IAutoMovieFramedBox.radius drives required-landmark framing: Half the box's horizontal diagonal, in meters.
   * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-framing-landmark-relations IAutoMovieFramedBox.radius realizes landmark-based framing: Half the box's horizontal diagonal, in meters.
   */
  radius: number;
}
