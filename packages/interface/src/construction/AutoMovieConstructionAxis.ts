import type { IAutoMovieConstructionCurvedAxis } from "./IAutoMovieConstructionCurvedAxis";
import type { IAutoMovieConstructionJointedAxis } from "./IAutoMovieConstructionJointedAxis";
import type { IAutoMovieConstructionLevelAxis } from "./IAutoMovieConstructionLevelAxis";
import type { IAutoMovieConstructionParallelAxis } from "./IAutoMovieConstructionParallelAxis";
import type { IAutoMovieConstructionStraightAxis } from "./IAutoMovieConstructionStraightAxis";

/**
 * A part's frame along its stations, discriminated on `type`: the section plane at each station, its source origin and orthonormal chart axes `u` and `v`, whose normal is `v x u`. The kind states whether station is arclength, world height or an authored source parameter; a drifting parallel origin need not move along its plane's normal.
 *
 * - `straight`: a part straight in its bone frame (a limb segment, a phalanx, a nose), the plane moved along its normal.
 * - `level`: the level plane at each height, the station the world height, the origin on an optional course.
 * - `parallel`: fixed authored section directions with three source-coordinate curves for the moving origin; station is the curves' parameter rather than necessarily arclength.
 * - `curved`: a part along a curved course (a spine, a neck, a tail), each plane square to the course's tangent and its axes carried by minimal rotation, so no section twists about the course.
 * - `jointed`: a part straight along each segment and turning at each joint (a limb along its bones), C2 through every turn.
 *
 * @evidence contracts/common.md#principled-implementation The kind preserves the authored plane contract: fixed straight/parallel directions, world-level planes, or tangent-normal curved/jointed transport. Minimal rotation uses the double reflection of Wang, Juttler, Zheng and Liu, ACM TOG 27(1), 2008.
 * @evidence contracts/common.md#clear-and-simple-design Five records distinguish a fixed straight frame, level planes, authored parallel planes, a tangent-normal curved course and a jointed one.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No frame is fitted to a mesh; a curved course is its own knots, and the step bounds the integration rather than smoothing it.
 * @evidence contracts/common.md#meaningful-documentation States the plane's origin, axes and station direction and each kind's use.
 */
export type AutoMovieConstructionAxis =
  | IAutoMovieConstructionStraightAxis
  | IAutoMovieConstructionLevelAxis
  | IAutoMovieConstructionParallelAxis
  | IAutoMovieConstructionCurvedAxis
  | IAutoMovieConstructionJointedAxis;
