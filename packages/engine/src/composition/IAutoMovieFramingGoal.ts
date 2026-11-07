/**
 * What a camera must show, by subjects rather than coordinates: the named
 * subjects fill a share of the frame height, seen from a bearing and an
 * elevation about their common centre. `resolveAutoMovieFraming` turns it
 * into a camera pose from the subjects' actual bounds.
 */
export interface IAutoMovieFramingGoal {
  /** Stable ids of the subjects to show; at least one. */
  subjects: readonly string[];

  /** Share of the frame height their bounding sphere's diameter fills, in (0, 1]. */
  fill: number;

  /** Horizontal bearing from the subjects' centre to the camera, radians from +Z toward +X. */
  bearing: number;

  /** Elevation of the camera above the horizontal, radians, in (-pi/2, pi/2). */
  elevation: number;

  /** Vertical field of view, radians, in (0, pi). */
  fieldOfView: number;
}
