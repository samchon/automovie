import type { IAutoMovieConstructionCurvedAxis } from "./IAutoMovieConstructionCurvedAxis";
import type { IAutoMovieConstructionJointedAxis } from "./IAutoMovieConstructionJointedAxis";
import type { IAutoMovieConstructionLevelAxis } from "./IAutoMovieConstructionLevelAxis";
import type { IAutoMovieConstructionStraightAxis } from "./IAutoMovieConstructionStraightAxis";

/**
 * A part's frame along its stations, discriminated on `type`: the section plane at each station, its origin on the axis and its chart axes `u` and `v` orthonormal in the plane, the stations advancing along `v x u`.
 *
 * - `straight`: a part straight in its bone frame (a limb segment, a phalanx, a nose), the plane moved along its normal.
 * - `level`: the level plane at each height, the station the world height, the origin on an optional course.
 * - `curved`: a part along a curved course (a spine, a neck, a tail), each plane square to the course's tangent and its axes carried by minimal rotation, so no section twists about the course.
 * - `jointed`: a part straight along each segment and turning at each joint (a limb along its bones), C2 through every turn.
 *
 * @evidence contracts/common.md#principled-implementation Sections square to a part's own axis cut it straight whatever its pose; minimal rotation (the double reflection of Wang, Juttler, Zheng and Liu, ACM TOG 27(1), 2008) carries the axes along a curved course without twist.
 * @evidence contracts/common.md#clear-and-simple-design Four records cover a fixed frame, the level planes, a curved course and a jointed one; each holds only what its frame needs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No frame is fitted to a mesh; a curved course is its own knots, and the step bounds the integration rather than smoothing it.
 * @evidence contracts/common.md#meaningful-documentation States the plane's origin, axes and station direction and each kind's use.
 */
export type AutoMovieConstructionAxis =
  | IAutoMovieConstructionStraightAxis
  | IAutoMovieConstructionLevelAxis
  | IAutoMovieConstructionCurvedAxis
  | IAutoMovieConstructionJointedAxis;
