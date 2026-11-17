import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMoviePathGround } from "./AutoMoviePathGround";
import type { IAutoMovieMotion } from "./IAutoMovieMotion";

/**
 * Data and callback contracts shared by the FollowPathMotion operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Waypoints are world metres projected onto XZ, requested speed is metres per second and turnWindow is metres. followPathMotion admits the path and gait before snapping duration to whole cycles; optional ground supplies world Y and defaults to zero.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This namespace groups the IAutoMovieFollowPathMotion contracts used by packages/engine/src/motion/followPathMotion.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.
 * @evidence contracts/development/design.md#principled-representation Waypoints are world metres projected onto XZ, requested speed is metres per second and turnWindow is metres. followPathMotion admits the path and gait before snapping duration to whole cycles; optional ground supplies world Y and defaults to zero. The namespace groups these type contracts without implementing the operation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieFollowPathMotion contract belongs to interface; packages/engine/src/motion/followPathMotion.ts uses its nested records and callbacks. Runtime computation remains with those consumers.
 */
export namespace IAutoMovieFollowPathMotion {
  /**
   * Bake an admitted in-place gait along an authored world XZ polyline, ignoring waypoint Y and sampling height from optional ground. Whole cycles nearest requested speed determine exact-arrival duration; yaw follows the tangent with a shortest-arc corner blend, and gait root bob/sway rotates with heading. Pathfinding is outside this operation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Waypoints are world metres projected onto XZ, requested speed is metres per second and turnWindow is metres. followPathMotion admits the path and gait before snapping duration to whole cycles; optional ground supplies world Y and defaults to zero.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMovieFollowPathMotion.IProps keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation Waypoints are world metres projected onto XZ, requested speed is metres per second and turnWindow is metres. followPathMotion admits the path and gait before snapping duration to whole cycles; optional ground supplies world Y and defaults to zero. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieFollowPathMotion.IProps contract belongs to interface; packages/engine/src/motion/followPathMotion.ts uses this boundary. Runtime computation remains with those consumers.
   */
  export type IProps = {
    /** Output clip id. */
    id: string;

    /** The looping in-place gait cycle to carry along the path. */
    gait: IAutoMovieMotion;

    /** World-space waypoints, at least two; `y` is ignored (see `ground`). */
    waypoints: readonly IAutoMovieVector3[];

    /** Requested pace along the path, m/s. The engine snaps to whole cycles. */
    speed: number;

    /** Ground height: plane scalar or `(x, z) → y` callback. Defaults to `0`. */
    ground?: AutoMoviePathGround;

    /** Corner blend span, meters of arc on both sides combined. Default `0.5`. */
    turnWindow?: number;
  };
}
