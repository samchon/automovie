/**
 * What a camera must show, by subjects rather than coordinates: the named
 * subjects fill a share of the frame height, seen from a bearing and an
 * elevation about their common centre. `resolveFraming` turns it into
 * a camera pose from the subjects' actual bounds. The resolver checks nonempty
 * subjects and the fill, elevation and field-of-view intervals, and rejects
 * unknown ids. The caller supplies finite bearing and finite nonnegative
 * subject bounds; those quantities are not admitted here.
 */
export interface IAutoMovieFramingGoal {
  /** Stable ids of the subjects to show; at least one. */
  subjects: readonly string[];

  /**
   * Perspective height fraction in (0, 1] used to size the enclosing-radius
   * framing estimate; distance is radius / (fill * tan(fieldOfView / 2)).
   */
  fill: number;

  /**
   * Horizontal bearing from the subjects' centre to the camera, radians from +Z
   * toward +X.
   */
  bearing: number;

  /** Elevation of the camera above the horizontal, radians, in (-pi/2, pi/2). */
  elevation: number;

  /** Vertical field of view, radians, in (0, pi). */
  fieldOfView: number;
}
