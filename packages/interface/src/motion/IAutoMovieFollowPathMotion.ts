import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMoviePathGround } from "./AutoMoviePathGround";
import type { IAutoMovieMotion } from "./IAutoMovieMotion";

/** Data and callback contracts shared by the FollowPathMotion operations. */
export namespace IAutoMovieFollowPathMotion {
  /**
   * Bake an admitted in-place gait along an authored world XZ polyline,
   * ignoring waypoint Y and sampling height from optional ground. Whole cycles
   * nearest requested speed determine exact-arrival duration; yaw follows the
   * tangent with a shortest-arc corner blend, and gait root bob/sway rotates
   * with heading. Pathfinding is outside this operation.
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
