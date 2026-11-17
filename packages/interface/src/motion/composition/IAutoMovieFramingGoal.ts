/**
 * What a camera must show, by subjects rather than coordinates: the named
 * subjects fill a share of the frame height, seen from a bearing and an
 * elevation about their common centre. `resolveAutoMovieFraming` turns it
 * into a camera pose from the subjects' actual bounds.
 * The resolver checks nonempty subjects and the fill, elevation and field-of-view
 * intervals, and rejects unknown ids. The caller supplies finite bearing and
 * finite nonnegative subject bounds; those quantities are not admitted here.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives subject-based framing, radian camera angles, fill estimate and the resolver's admission boundaries.
 * @evidence contracts/development/design.md#principled-representation Nonempty subjects, fill in (0,1], elevation in (-pi/2,pi/2) and field of view in (0,pi) are checked by resolveAutoMovieFraming; bearing and bounds remain caller premises.
 * @evidence contracts/development/design.md#minimal-and-owned-surface resolveAutoMovieFraming reads this canonical goal against caller-supplied subject spheres to produce a camera pose.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A goal names subjects instead of embedding a renderer camera or duplicating world coordinates.
 */
export interface IAutoMovieFramingGoal {
  /** Stable ids of the subjects to show; at least one. */
  subjects: readonly string[];

  /** Perspective height fraction in (0, 1] used to size the enclosing-radius framing estimate; distance is radius / (fill * tan(fieldOfView / 2)). */
  fill: number;

  /** Horizontal bearing from the subjects' centre to the camera, radians from +Z toward +X. */
  bearing: number;

  /** Elevation of the camera above the horizontal, radians, in (-pi/2, pi/2). */
  elevation: number;

  /** Vertical field of view, radians, in (0, pi). */
  fieldOfView: number;
}
