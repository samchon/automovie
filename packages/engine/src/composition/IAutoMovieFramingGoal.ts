/**
 * What a camera must show, by subjects rather than coordinates: the named
 * subjects fill a share of the frame height, seen from a bearing and an
 * elevation about their common centre. `resolveAutoMovieFraming` turns it
 * into a camera pose from the subjects' actual bounds.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (What a camera must show, by subjects rather than coordinates: the named subjects fill a share of the frame height, seen from a bearing and an elevation about their common centre) and documents 5 documented members as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents What a camera must show, by subjects rather than coordinates: the named subjects fill a share of the frame height, seen from a bearing and an elevation about their common centre: interface of 5 members (`subjects`, `fill`, `bearing`, `elevation`, `fieldOfView`); units and frames named in its text: frame, radians. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IAutoMovieFramingGoal` in packages/engine/src/composition/IAutoMovieFramingGoal.ts; its surface is the 5 members listed and the text shows 3 other files naming it, mostly packages/engine (2), movies (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
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
